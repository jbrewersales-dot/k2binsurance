import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PRODUCT_SLUGS, getSchema, slugForProduct, LEAD_STATUSES } from "@/lib/products";
import type { ProductSchema } from "@/lib/quote-schemas";
import {
  buildSchemaSnapshot,
  deriveContact,
  generateRefId,
  validateSubmission,
  type Answers,
  type LeadRecord,
} from "@/lib/submissions";

export const dynamic = "force-dynamic";

const postBody = z.object({
  product: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  signature: z.string(),
  consent: z.boolean(),
  clientRefId: z.string().optional(),
});

function schemaForProduct(product: string): ProductSchema | null {
  // Accept either the display label ("Workers' Comp") or a slug ("workers-comp").
  const slug = (PRODUCT_SLUGS as string[]).includes(product)
    ? product
    : slugForProduct(product);
  return slug ? getSchema(slug) : null;
}

// ---- POST /api/submissions (public) ----
export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = postBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Malformed submission." }, { status: 400 });
  }
  const { product, answers, signature, consent, clientRefId } = parsed.data;

  const schema = schemaForProduct(product);
  if (!schema) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  // Never trust the client — re-validate every required field server-side.
  const result = validateSubmission(schema, answers as Answers, signature, consent);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Please complete all required fields.", details: result.errors },
      { status: 422 },
    );
  }

  const { name, phone, email } = deriveContact(answers as Answers);

  // Prefer the client's displayed ref id (so the review preview matches the
  // confirmation) but regenerate on the vanishingly rare collision.
  const refIdRe = new RegExp(`^${schema.refIdPrefix}[A-Z0-9]{5}-\\d{4}$`);
  let id =
    clientRefId && refIdRe.test(clientRefId) ? clientRefId : generateRefId(schema);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.submission.findUnique({ where: { id }, select: { id: true } });
    if (!exists) break;
    id = generateRefId(schema);
  }

  const created = await prisma.submission.create({
    data: {
      id,
      product: schema.product,
      name,
      phone,
      email,
      signature: signature.trim(),
      answers: answers as Answers,
      schema: buildSchemaSnapshot(schema),
    },
    select: { id: true },
  });

  // TODO(notifications): fan out an email/SMS to the agency here so new leads
  // don't sit unseen (flagged as a recommended next step in the handoff).

  return NextResponse.json({ id: created.id }, { status: 201 });
}

// ---- GET /api/submissions (agent only) ----
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (product && product !== "all") where.product = product;
  if (status && (LEAD_STATUSES as readonly string[]).includes(status)) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { id: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.submission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  const leads: LeadRecord[] = rows.map((r) => ({
    id: r.id,
    product: r.product,
    status: r.status,
    submittedAt: r.submittedAt.toISOString(),
    name: r.name,
    phone: r.phone,
    email: r.email,
    signature: r.signature,
    answers: r.answers as Answers,
    schema: r.schema as LeadRecord["schema"],
  }));

  return NextResponse.json({ leads });
}

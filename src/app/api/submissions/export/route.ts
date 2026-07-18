import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/products";
import { buildCsv, csvFilename } from "@/lib/csv";
import { maskSensitiveAnswers } from "@/lib/sensitive";
import type { Answers, LeadRecord } from "@/lib/submissions";

export const dynamic = "force-dynamic";

// ---- GET /api/submissions/export (agent only) — streams a CSV ----
// Honors the same product/status/q filters as the dashboard.
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
    // CSV never contains full sensitive identifiers — masked only.
    answers: maskSensitiveAnswers(r.answers as Answers),
    schema: r.schema as LeadRecord["schema"],
  }));

  const csv = buildCsv(leads);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}

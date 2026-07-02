import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and passcode." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const agent = await prisma.agent.findUnique({ where: { email } });

  // Constant-ish response regardless of whether the email exists.
  const ok = agent
    ? await bcrypt.compare(parsed.data.password, agent.passwordHash)
    : await bcrypt.compare(parsed.data.password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv");

  if (!agent || !ok) {
    return NextResponse.json(
      { error: "That email or passcode doesn't match. Try again." },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    sub: agent.id,
    email: agent.email,
    name: agent.name,
  });

  const res = NextResponse.json({ ok: true, name: agent.name });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revealSensitiveAnswers } from "@/lib/sensitive";
import type { Answers } from "@/lib/submissions";

export const dynamic = "force-dynamic";

// ---- GET /api/submissions/:id/sensitive (agent only) ----
// Click-to-reveal: returns the decrypted sensitive identifiers for one lead.
// Values are never included in list responses, CSV exports, or logs.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.submission.findUnique({
    where: { id },
    select: { answers: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json(
    { values: revealSensitiveAnswers(row.answers as Answers) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

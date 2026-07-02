import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Lightweight liveness probe for App Runner / load balancers.
export async function GET() {
  return NextResponse.json({ ok: true, service: "k2b-insurance" });
}

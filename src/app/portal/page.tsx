import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { PortalDashboard } from "@/components/portal/PortalDashboard";

export const metadata: Metadata = { title: "Dashboard — K2B Agent Portal" };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getSession();
  if (!session) redirect("/portal/login");
  return <PortalDashboard agentName={session.name} />;
}

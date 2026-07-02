import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/portal/LoginForm";

export const metadata: Metadata = { title: "Agent portal — K2B Insurance" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/portal");
  return <LoginForm />;
}

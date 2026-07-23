import type { Metadata } from "next";
import { EmbedShell } from "@/components/EmbedShell";

const CLIENT_CENTER_URL =
  "https://customerservice.agentinsure.com/EzlynxCustomerService/kbinsurance/Account/LogIn";

export const metadata: Metadata = {
  title: "Client center — K2B Insurance",
  description:
    "Existing K2B Insurance customers: sign in to view your policies, request changes, and get documents.",
};

export default function ClientCenterPage() {
  return (
    <EmbedShell
      subtitle="Client center"
      title="Client center"
      intro="Existing customers: sign in to view your policies, request changes, and get documents — anytime."
      src={CLIENT_CENTER_URL}
      frameName="EZLynx Customer Service Portal"
      frameHeight={1600}
      fallbackNote={
        <>
          The client center is provided through our secure EZLynx service portal.
          Trouble loading?{" "}
          <a
            href={CLIENT_CENTER_URL}
            target="_blank"
            rel="noopener"
            style={{ color: "var(--blue-600)", fontWeight: 600 }}
          >
            Open it in a new tab
          </a>
          .
        </>
      }
    />
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { EmbedShell } from "@/components/EmbedShell";

const QUOTE_URL =
  "https://www.agentinsure.com/compare/auto-insurance-home-insurance/kbinsurance/quote.aspx";

export const metadata: Metadata = {
  title: "Instant online quoting — K2B Insurance",
  description:
    "Get live auto and home insurance rates right now through K2B Insurance's secure quoting system.",
};

export default function InstantQuotePage() {
  return (
    <EmbedShell
      subtitle="Instant online quoting"
      title={<>Instant auto &amp; home quoting</>}
      intro={
        <>
          Get live carrier rates right now through our secure quoting system. Prefer we
          do it?{" "}
          <Link href="/quote/auto" style={{ color: "var(--blue-600)", fontWeight: 600 }}>
            Send us your info
          </Link>{" "}
          and we&apos;ll shop it for you.
        </>
      }
      src={QUOTE_URL}
      frameName="Secure Live Insurance Quoting"
      frameHeight={1500}
      fallbackNote={
        <>
          Quoting is provided through our secure EZLynx consumer portal. Trouble
          loading?{" "}
          <a
            href={QUOTE_URL}
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

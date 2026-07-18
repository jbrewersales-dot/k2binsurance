import Link from "next/link";
import type { Metadata } from "next";
import { ShieldMark } from "@/components/Brand";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Privacy policy — K2B Insurance",
  description:
    "How K2B Insurance LLC collects, uses, and protects your information when you request a quote.",
};

const h2Style: React.CSSProperties = {
  font: "var(--fw-semibold) 19px/1.3 var(--font-display)",
  margin: "28px 0 8px",
  color: "var(--text-primary)",
};
const pStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: "var(--text-secondary)",
  margin: "0 0 8px",
};
const ulStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  paddingLeft: 20,
  margin: "8px 0",
  fontSize: 14,
  lineHeight: 1.6,
  color: "var(--text-secondary)",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-page)" }}>
      {/* Compact header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 32px",
          background: "var(--surface-card)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <ShieldMark size={40} />
          <span style={{ lineHeight: 1.15 }}>
            <span style={{ display: "block", font: "var(--fw-bold) 17px/1.2 var(--font-display)", color: "var(--text-primary)" }}>
              K2B Insurance
            </span>
            <span className="t-caption" style={{ color: "var(--text-muted)", fontSize: 11 }}>
              Privacy policy
            </span>
          </span>
        </Link>
        <a
          href="tel:+15736205630"
          className="mono"
          style={{ fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Icon name="phone" size={16} />
          (573) 620-5630
        </a>
      </header>

      {/* Content card */}
      <main style={{ flex: 1, padding: "40px 24px 72px", display: "flex", justifyContent: "center" }}>
        <article
          className="card"
          style={{ width: "100%", maxWidth: 720, padding: "40px 44px" }}
        >
          <span className="t-overline" style={{ color: "var(--text-muted)" }}>
            K2B Insurance LLC
          </span>
          <h1 style={{ font: "var(--fw-bold) 30px/1.15 var(--font-display)", margin: "6px 0 4px" }}>
            Privacy policy
          </h1>
          <p className="mono" style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px" }}>
            Effective July 18, 2026
          </p>

          <h2 style={h2Style}>Who we are</h2>
          <p style={pStyle}>
            K2B Insurance LLC is an independent insurance agency located inside Martindale
            Chevrolet, 521 US-61, New Madrid, MO 63869. This policy explains what
            information we collect when you request a quote or do business with us, how we
            use it, and the choices you have.
          </p>

          <h2 style={h2Style}>Information we collect</h2>
          <p style={pStyle}>
            When you request a quote we collect the information carriers require to rate
            and issue a policy, which can include:
          </p>
          <ul style={ulStyle}>
            <li>Contact details — name, phone number, email, and address</li>
            <li>Date of birth, Social Security number, and driver&apos;s license number</li>
            <li>Vehicle information (year/make/model, VIN, use, mileage) and driving history</li>
            <li>Property details (construction, systems, occupancy, rental information)</li>
            <li>Business information (entity type, payroll, operations, loss history)</li>
            <li>Current and prior insurance, claims history, and your electronic signature</li>
          </ul>

          <h2 style={h2Style}>How we use it</h2>
          <ul style={ulStyle}>
            <li>To prepare your quote and shop it across the carriers we represent</li>
            <li>
              To order the consumer reports carriers require — such as motor vehicle
              records, claims-history (CLUE) reports, and, where permitted by law,
              credit-based insurance scores
            </li>
            <li>To verify your identity and prevent fraud</li>
            <li>To contact you about your quote, policy, renewals, and service</li>
            <li>To meet insurance-regulatory and other legal obligations</li>
          </ul>

          <h2 style={h2Style}>Calls, texts &amp; email</h2>
          <p style={pStyle}>
            When you check the phone-contact consent box on a quote form, you agree that
            K2B Insurance may call or text you at the number you provided about your quote
            and related insurance services, including with automated technology or
            prerecorded messages. Message and data rates may apply. Consent is not a
            condition of purchase — you can withdraw it anytime by replying STOP to a
            text, telling us on a call, or phoning{" "}
            <a href="tel:+15736205630" className="mono">
              (573) 620-5630
            </a>
            .
          </p>

          <h2 style={h2Style}>How we share information</h2>
          <p style={pStyle}>
            We share your information only as needed to quote, bind, and service your
            insurance:
          </p>
          <ul style={ulStyle}>
            <li>Insurance carriers and underwriters we submit your application to</li>
            <li>Consumer reporting agencies that supply the reports listed above</li>
            <li>Service providers who help us operate (under confidentiality obligations)</li>
            <li>Regulators, or others when required by law</li>
          </ul>
          <p style={{ ...pStyle, fontWeight: 700, color: "var(--text-primary)" }}>
            We do not sell your personal information.
          </p>

          <h2 style={h2Style}>How we protect it</h2>
          <p style={pStyle}>
            Access to your information is limited to the licensed agent and staff who need
            it to serve you. Sensitive identifiers like Social Security and driver&apos;s
            license numbers are used only for the purposes above and retained only as long
            as insurance law and carrier requirements demand.
          </p>

          <h2 style={h2Style}>Your choices</h2>
          <ul style={ulStyle}>
            <li>Ask what information we hold about you, and correct it if it&apos;s wrong</li>
            <li>Opt out of calls, texts, or emails at any time</li>
            <li>Ask us questions about this policy before submitting a quote request</li>
          </ul>

          <h2 style={h2Style}>Contact us</h2>
          <p style={pStyle}>
            K2B Insurance LLC
            <br />
            Inside Martindale Chevrolet · 521 US-61, New Madrid, MO 63869
            <br />
            <a href="tel:+15736205630" className="mono">
              (573) 620-5630
            </a>
          </p>

          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              margin: "32px 0 0",
              paddingTop: 16,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            We may update this policy from time to time; the effective date above reflects
            the latest revision.
          </p>
        </article>
      </main>

      {/* Dark footer bar */}
      <footer
        style={{
          background: "var(--surface-inverse)",
          color: "var(--ink-300)",
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--ink-500)" }}>
          © 2026 K2B Insurance LLC · Licensed Missouri producer.
        </span>
        <Link href="/" style={{ fontSize: 12, color: "var(--blue-300)" }}>
          ← Back to k2binsurance.com
        </Link>
      </footer>
    </div>
  );
}

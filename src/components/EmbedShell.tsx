import Link from "next/link";
import { ShieldMark } from "./Brand";
import { Icon } from "./icons";

// Branded shell for third-party EZLynx iframe pages (Instant Quote, Client
// Center): compact header, title strip, iframe in a card, and an
// open-in-new-tab fallback since some browsers block third-party iframes.
export function EmbedShell({
  subtitle,
  title,
  intro,
  src,
  frameName,
  frameHeight,
  fallbackNote,
}: {
  subtitle: string;
  title: React.ReactNode;
  intro: React.ReactNode;
  src: string;
  frameName: string;
  frameHeight: number;
  fallbackNote: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-page)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "12px 32px",
          background: "var(--surface-card)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ShieldMark size={40} />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ font: "var(--fw-bold) 17px var(--font-display)", letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              K2B Insurance
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{subtitle}</span>
          </span>
        </Link>
        <a
          href="tel:+15736205630"
          className="mono"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 500 }}
        >
          <Icon name="phone" size={16} />
          (573) 620-5630
        </a>
      </header>

      <div style={{ padding: "20px 32px 8px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        <h1 style={{ font: "var(--fw-bold) 26px var(--font-display)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          {title}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>{intro}</p>
      </div>

      <div style={{ flex: 1, padding: "16px 32px 40px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <iframe
            src={src}
            name={frameName}
            style={{ display: "block", width: "100%", height: frameHeight, border: 0 }}
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "12px 0 0", textAlign: "center" }}>
          {fallbackNote}
        </p>
      </div>
    </div>
  );
}

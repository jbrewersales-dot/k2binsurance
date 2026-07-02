import Link from "next/link";

// The navy shield mark sits on a white rounded tile (logos are JPEG on white,
// no transparency — per the handoff, mount on a white tile on dark surfaces).
export function ShieldMark({ size = 40 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "var(--shadow-xs)",
        flex: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/k2b-logo-shield-navy.jpg"
        alt="K2B Insurance"
        width={size}
        height={size}
        style={{ objectFit: "cover" }}
      />
    </span>
  );
}

export function BrandLockup({
  href = "/",
  sub = "New Madrid, Missouri",
  inverse = false,
  size = 40,
}: {
  href?: string;
  sub?: string;
  inverse?: boolean;
  size?: number;
}) {
  return (
    <Link
      href={href}
      style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)" }}
    >
      <ShieldMark size={size} />
      <span style={{ lineHeight: 1.15 }}>
        <span
          className="t-heading"
          style={{ display: "block", color: inverse ? "#fff" : "var(--text-primary)" }}
        >
          K2B Insurance
        </span>
        <span
          className="t-caption"
          style={{ color: inverse ? "rgba(255,255,255,.7)" : "var(--text-muted)" }}
        >
          {sub}
        </span>
      </span>
    </Link>
  );
}

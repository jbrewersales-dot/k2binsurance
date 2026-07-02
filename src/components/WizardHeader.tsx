import { BrandLockup } from "./Brand";

export function WizardHeader({ productLabel }: { productLabel: string }) {
  return (
    <header style={{ background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <BrandLockup size={36} />
          <span
            className="t-caption"
            style={{
              padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              background: "var(--surface-brand-subtle)",
              color: "var(--text-link)",
              fontWeight: 600,
            }}
          >
            {productLabel} quote
          </span>
        </div>
        <a href="tel:+15736205630" className="mono t-body-sm" style={{ fontWeight: 600 }}>
          (573) 620-5630
        </a>
      </div>
    </header>
  );
}

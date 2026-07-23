import Link from "next/link";
import { BrandLockup } from "./Brand";
import { Icon } from "./icons";

export function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,.92)",
        backdropFilter: "saturate(180%) blur(8px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 68,
        }}
      >
        <BrandLockup />
        <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
          <Link href="/#products" className="t-body-sm nav-link">
            Coverage
          </Link>
          <Link href="/#why" className="t-body-sm nav-link">
            Why K2B
          </Link>
          <Link href="/client-center" className="t-body-sm nav-link">
            Client center
          </Link>
          <a
            href="tel:+15736205630"
            className="mono t-body-sm"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            (573) 620-5630
          </a>
          <Link href="/portal" className="btn btn-secondary btn-sm">
            <Icon name="lock" size={15} />
            Agent login
          </Link>
        </nav>
      </div>
    </header>
  );
}

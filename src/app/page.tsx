import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Icon } from "@/components/icons";

const RENTERS_URL =
  process.env.NEXT_PUBLIC_RENTERS_URL ??
  "https://www.epremiuminsurance.com/DirectToConsumerPartner.aspx?IRISAccountID=zMVdVah5rFs%3d&TopLevelIRISAccountID=pKgVh2ygOEw%3d";

type ProductCard = {
  icon: string;
  title: string;
  desc: string;
  checklist: string[];
  cta: string;
  href: string;
  external?: boolean;
  note?: string;
  variant?: "primary" | "secondary";
};

const PRODUCTS: ProductCard[] = [
  {
    icon: "car",
    title: "Auto insurance",
    desc: "Cars, trucks, and the vehicle you just drove off the lot. Liability, collision, comprehensive, and roadside — built to fit.",
    checklist: [
      "Liability, collision & comprehensive",
      "Uninsured motorist & medical",
      "Roadside, rental & gap options",
    ],
    cta: "Start auto quote",
    href: "/quote/auto",
    variant: "primary",
  },
  {
    icon: "home",
    title: "Home insurance",
    desc: "Protect the house, everything in it, and yourself. Dwelling, personal property, liability, and the endorsements that matter.",
    checklist: [
      "Dwelling & other structures",
      "Personal property & liability",
      "Water backup & wind/hail options",
    ],
    cta: "Start home quote",
    href: "/quote/home",
    variant: "primary",
  },
  {
    icon: "shield",
    title: "Renters insurance",
    desc: "Renting? Cover your belongings and your liability for a few dollars a month. Quick quote through our carrier partner.",
    checklist: [
      "Personal belongings coverage",
      "Personal liability protection",
      "Loss of use / additional living",
    ],
    cta: "Get renters quote",
    href: RENTERS_URL,
    external: true,
    note: "Opens our carrier's secure renters quote form.",
    variant: "secondary",
  },
  {
    icon: "building",
    title: "Commercial & business",
    desc: "General liability, BOP, property, commercial auto, professional & cyber — we write it all for local businesses.",
    checklist: [
      "General liability & BOP",
      "Commercial property & auto",
      "Professional, cyber & umbrella",
    ],
    cta: "Start business quote",
    href: "/quote/commercial",
    variant: "primary",
  },
  {
    icon: "users",
    title: "Workers' comp",
    desc: "Cover your crew and stay compliant. We classify your payroll and shop it to get you the right rate.",
    checklist: [
      "Injury & medical coverage",
      "State compliance & class codes",
      "Certificates & waivers",
    ],
    cta: "Start workers' comp quote",
    href: "/quote/workers-comp",
    variant: "primary",
  },
  {
    icon: "key",
    title: "Landlord insurance",
    desc: "Own a rental? Protect the building, your liability, and the rent you collect if a covered loss shuts it down.",
    checklist: [
      "Dwelling & rental structures",
      "Loss of rents coverage",
      "Landlord liability protection",
    ],
    cta: "Start landlord quote",
    href: "/quote/landlord",
    variant: "primary",
  },
];

const FEATURES = [
  {
    icon: "shieldCheck",
    title: "Licensed & independent",
    desc: "A licensed Missouri producer who shops multiple carriers to find your rate.",
  },
  {
    icon: "mapPin",
    title: "Right on the lot",
    desc: "Inside Martindale Chevrolet, 521 US-61. Bind coverage before you drive off.",
  },
  {
    icon: "clock",
    title: "Quotes in minutes",
    desc: "Fill out the form once. We follow up with a real rate, usually the same business day.",
  },
  {
    icon: "refresh",
    title: "One agent, every renewal",
    desc: "We re-shop your policy and email a revised rate 30 days before the term ends.",
  },
];

function Check() {
  return (
    <span style={{ color: "var(--text-success)", flex: "none", marginTop: 2 }}>
      <Icon name="check" size={16} />
    </span>
  );
}

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section style={{ background: "var(--surface-inverse)", color: "#fff" }}>
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "var(--space-12)",
            alignItems: "center",
            padding: "var(--space-16) var(--space-6)",
          }}
        >
          <div>
            <span
              className="t-overline"
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255,255,255,.08)",
                color: "var(--amber-300)",
                marginBottom: "var(--space-5)",
              }}
            >
              Independent agency · New Madrid, MO
            </span>
            <h1 className="t-display-xl" style={{ marginBottom: "var(--space-4)" }}>
              Coverage that rides along.
            </h1>
            <p
              className="t-body"
              style={{
                color: "rgba(255,255,255,.75)",
                fontSize: 18,
                maxWidth: 520,
                marginBottom: "var(--space-8)",
              }}
            >
              Auto, home, and renters insurance quoted right here in New Madrid. Answer
              a few questions and we&apos;ll get back to you with a real rate — usually
              the same day.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <Link href="/quote/auto" className="btn btn-gold">
                Start auto quote
              </Link>
              <Link href="/quote/home" className="btn btn-outline-inverse">
                Start home quote
              </Link>
            </div>
            <div style={{ marginTop: 14, marginBottom: 26 }}>
              <Link
                href="/instant-quote"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--blue-300)",
                }}
              >
                <Icon name="zap" size={15} strokeWidth={2} />
                Or get instant online rates yourself →
              </Link>
            </div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "var(--space-5)" }}>
              {["Licensed in Missouri", "Multiple carriers, one agent", "No fee to get a quote"].map(
                (c) => (
                  <li key={c} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Check />
                    <span className="t-body-sm" style={{ color: "rgba(255,255,255,.85)" }}>
                      {c}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Logo card + stat callouts */}
          <div
            className="card"
            style={{ padding: "var(--space-6)", background: "var(--ink-900)", border: "1px solid rgba(255,255,255,.08)" }}
          >
            <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", background: "#fff", marginBottom: "var(--space-5)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/k2b-logo-banner.jpg"
                alt="K2B Insurance — New Madrid, Missouri · 573-620-5630"
                style={{ width: "100%", display: "block" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-3)" }}>
              {[
                ["3", "coverage types"],
                ["Same day", "quote turnaround"],
                ["Local", "New Madrid, MO"],
              ].map(([n, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div className="t-num" style={{ fontSize: 20, fontWeight: 600, color: "var(--amber-300)" }}>
                    {n}
                  </div>
                  <div className="t-caption" style={{ color: "rgba(255,255,255,.6)" }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" style={{ padding: "var(--space-16) 0" }}>
        <div className="container">
          <span className="t-overline" style={{ color: "var(--text-link)" }}>
            Get a quote
          </span>
          <h2 className="t-display" style={{ marginTop: "var(--space-2)", marginBottom: "var(--space-10)" }}>
            What can we cover for you?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "var(--space-5)",
            }}
          >
            {PRODUCTS.map((p) => (
              <article
                key={p.title}
                className="card"
                style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column" }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: "var(--surface-brand-subtle)",
                    color: "var(--accent-primary)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <Icon name={p.icon} size={22} />
                </span>
                <h3 className="t-heading" style={{ marginBottom: "var(--space-2)" }}>
                  {p.title}
                </h3>
                <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
                  {p.desc}
                </p>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
                  {p.checklist.map((c) => (
                    <li key={c} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <Check />
                      <span className="t-body-sm" style={{ color: "var(--text-secondary)" }}>
                        {c}
                      </span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "auto" }}>
                  {p.external ? (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener"
                      className="btn btn-secondary btn-block"
                    >
                      {p.cta}
                      <Icon name="externalLink" size={16} />
                    </a>
                  ) : (
                    <Link
                      href={p.href}
                      className={`btn btn-block ${p.variant === "primary" ? "btn-primary" : "btn-secondary"}`}
                    >
                      {p.cta}
                    </Link>
                  )}
                  {p.note && (
                    <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: "var(--space-2)", textAlign: "center" }}>
                      {p.note}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why K2B */}
      <section id="why" style={{ padding: "var(--space-16) 0", background: "var(--surface-card)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container">
          <h2 className="t-display" style={{ marginBottom: "var(--space-10)" }}>
            Why folks around New Madrid choose K2B
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-8)" }}>
            {FEATURES.map((f) => (
              <div key={f.title}>
                <span style={{ display: "inline-flex", color: "var(--accent-primary)", marginBottom: "var(--space-3)" }}>
                  <Icon name={f.icon} size={26} />
                </span>
                <h3 className="t-heading" style={{ marginBottom: "var(--space-2)" }}>
                  {f.title}
                </h3>
                <p className="t-body-sm" style={{ color: "var(--text-secondary)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section style={{ background: "var(--surface-brand)", color: "#fff" }}>
        <div
          className="container"
          style={{
            padding: "var(--space-12) var(--space-6)",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-6)",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 className="t-title" style={{ marginBottom: "var(--space-2)" }}>
              Not sure which coverage you need?
            </h2>
            <p className="t-body" style={{ color: "rgba(255,255,255,.85)" }}>
              Call us at{" "}
              <a href="tel:+15736205630" style={{ textDecoration: "underline" }}>
                (573) 620-5630
              </a>{" "}
              or start a quote and we&apos;ll sort it out together.
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Link href="/quote/auto" className="btn btn-gold">
              Get a quote
            </Link>
            <a href="tel:+15736205630" className="btn btn-outline-inverse">
              <Icon name="phone" size={16} />
              Call the agency
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "var(--surface-card)", borderTop: "1px solid var(--border-subtle)" }}>
        <div
          className="container"
          style={{ padding: "var(--space-12) var(--space-6)", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "var(--space-8)" }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: "var(--radius-md)", overflow: "hidden", background: "#fff", boxShadow: "var(--shadow-xs)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/k2b-logo-shield-silver.jpg" alt="K2B Insurance LLC" width={40} height={40} style={{ objectFit: "cover" }} />
              </span>
              <span className="t-heading">K2B Insurance LLC</span>
            </div>
            <p className="t-body-sm" style={{ color: "var(--text-secondary)", maxWidth: 340 }}>
              Independent insurance agency serving New Madrid and southeast Missouri. Auto
              · Home · Renters.
            </p>
          </div>
          <div>
            <h4 className="t-overline" style={{ color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              Visit us
            </h4>
            <address className="t-body-sm" style={{ fontStyle: "normal", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Inside Martindale Chevrolet
              <br />
              521 US-61
              <br />
              New Madrid, MO 63869
            </address>
          </div>
          <div>
            <h4 className="t-overline" style={{ color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              Get in touch
            </h4>
            <div className="t-body-sm" style={{ display: "grid", gap: "var(--space-2)" }}>
              <a href="tel:+15736205630" className="mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                (573) 620-5630
              </a>
              <Link href="/portal" className="nav-link">
                Agent login
              </Link>
              <Link href="/client-center" style={{ color: "var(--text-link)" }}>
                Client center — manage your policy
              </Link>
              <Link href="/instant-quote" style={{ color: "var(--text-link)" }}>
                Instant online quoting
              </Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div
            className="container"
            style={{ padding: "var(--space-4) var(--space-6)", display: "flex", flexWrap: "wrap", gap: "var(--space-3)", justifyContent: "space-between" }}
          >
            <span className="t-caption" style={{ color: "var(--text-muted)" }}>
              © 2026 K2B Insurance LLC · Licensed Missouri producer.
            </span>
            <span style={{ display: "inline-flex", gap: 18, alignItems: "center" }}>
              <Link href="/privacy" className="t-caption" style={{ color: "var(--text-link)" }}>
                Privacy policy
              </Link>
              <span className="t-caption" style={{ color: "var(--text-muted)" }}>
                Quotes are estimates and subject to carrier underwriting.
              </span>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

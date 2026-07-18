"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import {
  LEAD_STATUSES,
  SENSITIVE_KEYS,
  STATUS_COLORS,
  productColor,
  type LeadStatus,
} from "@/lib/products";
import { displayAnswer, formatDateTime, cleanLabel } from "@/lib/format";
import type { LeadRecord } from "@/lib/submissions";

const SENSITIVE_SET = new Set<string>(SENSITIVE_KEYS);

function ProductBadge({ product }: { product: string }) {
  const c = productColor(product);
  return (
    <span className="badge" style={{ color: c.fg, background: c.bg }}>
      {product}
    </span>
  );
}

function telHref(phone: string) {
  return "tel:" + (phone || "").replace(/[^0-9+]/g, "");
}

function buildPrintHtml(lead: LeadRecord): string {
  const answers = lead.answers ?? {};
  const groups = lead.schema
    .map((g) => {
      const rows = g.fields
        .map(
          (f) =>
            `<tr><th>${cleanLabel(f.label)}</th><td>${displayAnswer(answers[f.k])}</td></tr>`,
        )
        .join("");
      return `<h2>${g.title}</h2><table>${rows}</table>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${lead.id}</title>
    <style>
      body{font:14px/1.5 -apple-system,Segoe UI,sans-serif;color:#1A2132;margin:32px;}
      h1{font-size:22px;margin:0 0 4px;} .meta{color:#535F77;margin-bottom:24px;}
      h2{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#6F7D97;margin:24px 0 8px;border-bottom:1px solid #DDE3EE;padding-bottom:4px;}
      table{width:100%;border-collapse:collapse;} th{text-align:left;color:#6F7D97;font-weight:500;width:42%;padding:4px 8px 4px 0;vertical-align:top;} td{padding:4px 0;}
      .sig{font-style:italic;font-size:18px;margin-top:8px;}
    </style></head><body>
    <h1>${lead.name || "(no name)"} — ${lead.product}</h1>
    <div class="meta">${lead.id} · Received ${formatDateTime(lead.submittedAt)}<br>${lead.phone} · ${lead.email}</div>
    ${groups}
    <h2>Electronic signature</h2>
    <div class="sig">${lead.signature || lead.name}</div>
    <div class="meta">Signed &amp; authorized ${formatDateTime(lead.submittedAt)}</div>
    </body></html>`;
}

export function LeadDetail({
  lead,
  onBack,
  onStatusChange,
  statusBusy,
  onToast,
}: {
  lead: LeadRecord;
  onBack: () => void;
  onStatusChange: (status: LeadStatus) => void;
  statusBusy: boolean;
  onToast: (msg: string) => void;
}) {
  const [copyLabel, setCopyLabel] = useState("Copy contact info");
  const answers = lead.answers ?? {};

  // Click-to-reveal for masked sensitive identifiers. One authenticated fetch
  // pulls the decrypted values; each field then toggles individually.
  const [sensitiveValues, setSensitiveValues] = useState<Record<string, string> | null>(null);
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [revealBusy, setRevealBusy] = useState(false);

  async function toggleReveal(key: string) {
    if (shown.has(key)) {
      setShown((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
      return;
    }
    let values = sensitiveValues;
    if (!values) {
      setRevealBusy(true);
      try {
        const res = await fetch(`/api/submissions/${lead.id}/sensitive`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        values = (await res.json()).values ?? {};
        setSensitiveValues(values);
      } catch {
        onToast("Couldn't reveal — try again.");
        return;
      } finally {
        setRevealBusy(false);
      }
    }
    setShown((s) => new Set(s).add(key));
  }

  function copyContact() {
    const text = [lead.name, lead.phone, lead.email].filter(Boolean).join("\n");
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopyLabel("Copied ✓");
        setTimeout(() => setCopyLabel("Copy contact info"), 1600);
      },
      () => onToast("Couldn't copy to clipboard."),
    );
  }

  function printLead() {
    const w = window.open("", "_blank");
    if (!w) {
      onToast("Enable pop-ups to print.");
      return;
    }
    w.document.write(buildPrintHtml(lead));
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="container" style={{ padding: "var(--space-8) var(--space-6) var(--space-16)" }}>
      <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: "var(--space-5)" }}>
        <Icon name="arrowLeft" size={15} />
        All leads
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-6)", alignItems: "start" }}>
        <div>
          {/* Header card */}
          <div className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: 6 }}>
                  <h1 className="t-title">{lead.name || "(no name)"}</h1>
                  <ProductBadge product={lead.product} />
                </div>
                <p className="t-body-sm" style={{ color: "var(--text-muted)" }}>
                  <span className="mono">{lead.id}</span> · received {formatDateTime(lead.submittedAt)}
                </p>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                <a href={telHref(lead.phone)} className="btn btn-primary btn-md">
                  <Icon name="phone" size={15} />
                  Call
                </a>
                <a href={`mailto:${lead.email}`} className="btn btn-secondary btn-md">
                  <Icon name="mail" size={15} />
                  Email
                </a>
              </div>
            </div>
          </div>

          {/* Q&A groups */}
          {lead.schema.map((g) => (
            <div key={g.title} className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-4)" }}>
              <h2 className="t-heading" style={{ marginBottom: "var(--space-4)" }}>
                {g.title}
              </h2>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3) var(--space-5)" }}>
                {g.fields.map((f) => {
                  const sensitive = SENSITIVE_SET.has(f.k) && answers[f.k];
                  const revealed = sensitive && shown.has(f.k) && sensitiveValues?.[f.k];
                  return (
                    <div key={f.k}>
                      <dt className="t-caption" style={{ color: "var(--text-muted)" }}>
                        {cleanLabel(f.label)}
                      </dt>
                      <dd className="t-body-sm" style={{ marginTop: 2 }}>
                        {sensitive ? (
                          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                            <span className="mono">
                              {revealed ? sensitiveValues![f.k] : displayAnswer(answers[f.k])}
                            </span>
                            <button
                              onClick={() => toggleReveal(f.k)}
                              disabled={revealBusy}
                              className="t-caption"
                              style={{
                                border: "none",
                                background: "none",
                                color: "var(--text-link)",
                                cursor: "pointer",
                                fontWeight: 600,
                                padding: 0,
                              }}
                            >
                              {shown.has(f.k) ? "Hide" : "Reveal"}
                            </button>
                          </span>
                        ) : (
                          displayAnswer(answers[f.k])
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}

          {/* Signature */}
          <div className="card" style={{ padding: "var(--space-6)" }}>
            <h2 className="t-heading" style={{ marginBottom: "var(--space-3)" }}>
              Electronic signature
            </h2>
            <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22 }}>
              {lead.signature || lead.name}
            </p>
            <p className="t-body-sm" style={{ color: "var(--text-success)", marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
              <Icon name="check" size={15} />
              Signed &amp; authorized {formatDateTime(lead.submittedAt)}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "grid", gap: "var(--space-4)", position: "sticky", top: 84 }}>
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <h3 className="t-overline" style={{ color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              Lead status
            </h3>
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              {LEAD_STATUSES.map((s) => {
                const active = lead.status === s;
                const c = STATUS_COLORS[s];
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(s)}
                    disabled={statusBusy}
                    className="t-body-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: active ? 600 : 400,
                      color: active ? c.fg : "var(--text-secondary)",
                      background: active ? c.bg : "transparent",
                      border: `1px solid ${active ? c.fg : "var(--border-subtle)"}`,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.fg }} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: "var(--space-5)" }}>
            <h3 className="t-overline" style={{ color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              Contact
            </h3>
            <div style={{ display: "grid", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              <a href={telHref(lead.phone)} className="mono t-body-sm" style={{ fontWeight: 600 }}>
                {lead.phone || "—"}
              </a>
              <a href={`mailto:${lead.email}`} className="t-body-sm nav-link">
                {lead.email || "—"}
              </a>
            </div>
            <button className="btn btn-secondary btn-block btn-md" onClick={copyContact} style={{ marginBottom: "var(--space-2)" }}>
              <Icon name="copy" size={15} />
              {copyLabel}
            </button>
            <button className="btn btn-primary btn-block btn-md" onClick={printLead}>
              <Icon name="printer" size={15} />
              Print / save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

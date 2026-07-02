"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldMark } from "@/components/Brand";
import { Icon } from "@/components/icons";
import { LeadDetail } from "./LeadDetail";
import {
  PRODUCT_FILTERS,
  STATUS_COLORS,
  productColor,
  type LeadStatus,
} from "@/lib/products";
import { timeAgo, isToday } from "@/lib/format";
import type { LeadRecord } from "@/lib/submissions";

function ProductBadge({ product }: { product: string }) {
  const c = productColor(product);
  return (
    <span className="badge" style={{ color: c.fg, background: c.bg }}>
      {product}
    </span>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className="badge" style={{ color: c.fg, background: c.bg }}>
      <span className="dot" />
      {status}
    </span>
  );
}

export function PortalDashboard({ agentName }: { agentName: string }) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string, ms = 2200) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/portal/login");
        return;
      }
      const body = await res.json();
      setLeads(body.leads ?? []);
    } catch {
      showToast("Couldn't load leads.");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const personal = leads.filter((r) => r.product === "Auto" || r.product === "Home").length;
    const business = leads.filter(
      (r) => r.product === "Commercial" || r.product === "Workers' Comp" || r.product === "Landlord",
    ).length;
    const newToday = leads.filter((r) => isToday(r.submittedAt)).length;
    return [
      { label: "Total leads", value: String(leads.length), sub: "All product lines" },
      { label: "Personal lines", value: String(personal), sub: "Auto + Home" },
      { label: "Business lines", value: String(business), sub: "Commercial, WC, Landlord" },
      { label: "New today", value: String(newToday), sub: "Since midnight" },
    ];
  }, [leads]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((r) => {
      if (productFilter !== "all" && r.product !== productFilter) return false;
      if (!needle) return true;
      return [r.name, r.phone, r.email, r.id].some((v) =>
        (v ?? "").toLowerCase().includes(needle),
      );
    });
  }, [leads, q, productFilter]);

  const selected = selectedId ? leads.find((l) => l.id === selectedId) ?? null : null;

  async function changeStatus(status: LeadStatus) {
    if (!selected) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/submissions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, status } : l)));
    } catch {
      showToast("Couldn't update status.");
    } finally {
      setStatusBusy(false);
    }
  }

  function exportCsv() {
    if (filtered.length === 0) {
      showToast("No leads to export.", 1800);
      return;
    }
    const params = new URLSearchParams();
    if (productFilter !== "all") params.set("product", productFilter);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    window.location.href = `/api/submissions/export${qs ? `?${qs}` : ""}`;
    showToast(`Exported ${filtered.length} lead${filtered.length > 1 ? "s" : ""} to CSV.`);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
      {/* Dark sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--surface-inverse)",
          color: "#fff",
        }}
      >
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <ShieldMark size={34} />
            <span className="t-heading" style={{ color: "#fff" }}>
              Agent portal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="t-body-sm" style={{ color: "rgba(255,255,255,.6)", marginRight: 8 }}>
              {agentName}
            </span>
            <button className="btn btn-gold btn-md" onClick={exportCsv}>
              <Icon name="download" size={15} />
              Export CSV
            </button>
            <button className="btn btn-outline-inverse btn-md" onClick={load}>
              <Icon name="refresh" size={15} />
              Refresh
            </button>
            <button className="btn btn-outline-inverse btn-md" onClick={signOut}>
              <Icon name="logout" size={15} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {selected ? (
        <LeadDetail
          lead={selected}
          onBack={() => setSelectedId(null)}
          onStatusChange={changeStatus}
          statusBusy={statusBusy}
          onToast={showToast}
        />
      ) : (
        <div className="container" style={{ padding: "var(--space-8) var(--space-6) var(--space-16)" }}>
          {/* KPI tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            {stats.map((s) => (
              <div key={s.label} className="card" style={{ padding: "var(--space-5)" }}>
                <div className="t-overline" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </div>
                <div className="t-num" style={{ fontSize: 32, fontWeight: 700, margin: "4px 0" }}>
                  {s.value}
                </div>
                <div className="t-caption" style={{ color: "var(--text-muted)" }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center", marginBottom: "var(--space-5)" }}>
            <div style={{ position: "relative", flex: "1 1 260px", minWidth: 240 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Icon name="search" size={16} />
              </span>
              <input
                className="input"
                style={{ paddingLeft: 38 }}
                placeholder="Search name, phone, or email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="chip-group">
              {PRODUCT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`chip${productFilter === f.value ? " selected" : ""}`}
                  onClick={() => setProductFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              className="t-overline"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr 2fr 1fr 1fr 32px",
                gap: "var(--space-4)",
                padding: "var(--space-3) var(--space-5)",
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--surface-raised)",
              }}
            >
              <span>Applicant</span>
              <span>Product</span>
              <span>Contact</span>
              <span>Received</span>
              <span>Status</span>
              <span />
            </div>

            {loading ? (
              <EmptyRow title="Loading leads…" desc="One moment." />
            ) : filtered.length === 0 ? (
              leads.length === 0 ? (
                <EmptyRow
                  title="No quote requests yet"
                  desc="Submissions from the quote forms will appear here."
                />
              ) : (
                <EmptyRow
                  title="No leads match your filters"
                  desc="Try clearing the search or product filter."
                />
              )
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="lead-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.2fr 2fr 1fr 1fr 32px",
                    gap: "var(--space-4)",
                    padding: "var(--space-4) var(--space-5)",
                    width: "100%",
                    textAlign: "left",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span>
                    <span className="t-body-sm" style={{ fontWeight: 600, display: "block" }}>
                      {r.name || "(no name)"}
                    </span>
                    <span className="mono t-caption" style={{ color: "var(--text-muted)" }}>
                      {r.id}
                    </span>
                  </span>
                  <span>
                    <ProductBadge product={r.product} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="mono t-caption" style={{ display: "block" }}>
                      {r.phone || "—"}
                    </span>
                    <span
                      className="t-caption"
                      style={{ color: "var(--text-muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {r.email || "—"}
                    </span>
                  </span>
                  <span className="t-caption" style={{ color: "var(--text-secondary)" }}>
                    {timeAgo(r.submittedAt)}
                  </span>
                  <span>
                    <StatusBadge status={r.status} />
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    <Icon name="chevronRight" size={16} />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--ink-900)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: "var(--radius-full)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 100,
          }}
          className="t-body-sm"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function EmptyRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ padding: "var(--space-12) var(--space-6)", textAlign: "center" }}>
      <div className="t-heading" style={{ marginBottom: 6 }}>
        {title}
      </div>
      <div className="t-body-sm" style={{ color: "var(--text-muted)" }}>
        {desc}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldMark } from "@/components/Brand";
import { Icon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error ?? "That email or passcode doesn't match. Try again.");
        return;
      }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-page)",
        padding: "var(--space-6)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: "var(--space-8)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-5)" }}>
          <ShieldMark size={52} />
        </div>
        <h1 className="t-title" style={{ textAlign: "center", marginBottom: "var(--space-1)" }}>
          Agent portal
        </h1>
        <p
          className="t-body-sm"
          style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}
        >
          Sign in to view and manage quote requests.
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              placeholder="you@k2binsurance.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: "var(--space-5)" }}>
            <label className="field-label" htmlFor="password">
              Passcode
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="Enter passcode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="t-body-sm"
              style={{
                background: "var(--red-50)",
                border: "1px solid var(--red-100)",
                color: "var(--text-danger)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3)",
                marginBottom: "var(--space-4)",
              }}
            >
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "var(--space-5)" }}>
          <Link href="/" className="t-body-sm nav-link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="arrowLeft" size={14} />
            Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}

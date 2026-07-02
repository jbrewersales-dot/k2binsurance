"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProductSchema, WizardField } from "@/lib/quote-schemas";
import { Icon } from "./icons";
import { WizardHeader } from "./WizardHeader";

type View = "form" | "review" | "thanks";
type Values = Record<string, string | string[]>;

function genRefId(prefix: string): string {
  const rand = Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  )
    .join("")
    .toUpperCase();
  return `${prefix}${rand}-${new Date().getFullYear()}`;
}

function cleanLabel(label: string): string {
  return label.replace(/\s*\(.*?\)\s*/g, " ").trim();
}

function isEmpty(v: string | string[] | undefined): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  return v.trim() === "";
}

function displayVal(v: string | string[] | undefined): string {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return v.trim() === "" ? "—" : v;
}

export function Wizard({
  schema,
  crossSell,
}: {
  schema: ProductSchema;
  crossSell: { label: string; href: string };
}) {
  const steps = schema.steps;
  const totalSteps = steps.length + 1; // + review

  const [step, setStep] = useState(0);
  const [view, setView] = useState<View>("form");
  const [data, setData] = useState<Values>({});
  const [signature, setSignature] = useState("");
  const [consent, setConsent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [refId] = useState(() => genRefId(schema.refIdPrefix));
  const [finalId, setFinalId] = useState(refId);

  const invalidKeys = useMemo(() => {
    const cur = steps[step];
    if (!cur) return new Set<string>();
    const bad = new Set<string>();
    for (const f of cur.fields) {
      if (f.req && isEmpty(data[f.k])) bad.add(f.k);
    }
    return bad;
  }, [steps, step, data]);

  function setField(k: string, v: string | string[]) {
    setData((d) => ({ ...d, [k]: v }));
  }
  function toggleMulti(k: string, opt: string) {
    setData((d) => {
      const arr = Array.isArray(d[k]) ? (d[k] as string[]) : [];
      return { ...d, [k]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt] };
    });
  }

  function onContinue() {
    if (invalidKeys.size > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      setView("review");
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function editGroup(i: number) {
    setView("form");
    setStep(i);
    setShowErrors(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  async function onSubmit() {
    setReviewError(null);
    setSubmitError(null);
    if (isEmpty(signature)) {
      setReviewError("Type your full legal name to sign.");
      return;
    }
    if (!consent) {
      setReviewError("Please check the authorization box to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: schema.product,
          answers: data,
          signature,
          consent,
          clientRefId: refId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      const body = await res.json();
      setFinalId(body.id ?? refId);
      setView("thanks");
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Network error — your answers are safe. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const displayStep = view === "form" ? step : steps.length;
  const percent = Math.round((displayStep / (totalSteps - 1)) * 100);
  const firstName = typeof data.firstName === "string" ? data.firstName : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
      <WizardHeader productLabel={schema.product} />

      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "var(--space-8) var(--space-5) var(--space-16)",
        }}
      >
        {view !== "thanks" && (
          <Progress
            label={`Step ${displayStep + 1} of ${totalSteps}`}
            percent={percent}
            total={totalSteps}
            activeIndex={displayStep}
          />
        )}

        {view === "form" && (
          <FormStep
            field={steps[step]}
            data={data}
            showErrors={showErrors}
            invalidKeys={invalidKeys}
            onText={setField}
            onChip={setField}
            onMulti={toggleMulti}
          />
        )}

        {view === "review" && (
          <ReviewStep
            schema={schema}
            data={data}
            refId={refId}
            signature={signature}
            consent={consent}
            error={reviewError}
            submitError={submitError}
            submitting={submitting}
            onEdit={editGroup}
            onSignature={setSignature}
            onConsent={setConsent}
            onBack={() => {
              setView("form");
              setStep(steps.length - 1);
            }}
            onSubmit={onSubmit}
          />
        )}

        {view === "thanks" && (
          <ThanksStep firstName={firstName} refId={finalId} crossSell={crossSell} />
        )}

        {view === "form" && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-6)" }}>
            {step === 0 ? (
              <Link href="/" className="btn btn-secondary">
                <Icon name="arrowLeft" size={16} />
                Back
              </Link>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowErrors(false);
                  setStep((s) => s - 1);
                  if (typeof window !== "undefined") window.scrollTo({ top: 0 });
                }}
              >
                <Icon name="arrowLeft" size={16} />
                Back
              </button>
            )}
            <button className="btn btn-primary" onClick={onContinue}>
              {step === steps.length - 1 ? "Review quote" : "Continue"}
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Progress({
  label,
  percent,
  total,
  activeIndex,
}: {
  label: string;
  percent: number;
  total: number;
  activeIndex: number;
}) {
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
        <span className="t-body-sm" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          {label}
        </span>
        <span className="t-num t-body-sm" style={{ color: "var(--text-muted)" }}>
          {percent}%
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: "var(--radius-full)",
              background:
                i < activeIndex
                  ? "var(--accent-primary)"
                  : i === activeIndex
                    ? "var(--accent-primary)"
                    : "var(--border-subtle)",
              opacity: i <= activeIndex ? 1 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FormStep({
  field: stepDef,
  data,
  showErrors,
  invalidKeys,
  onText,
  onChip,
  onMulti,
}: {
  field: ProductSchema["steps"][number];
  data: Values;
  showErrors: boolean;
  invalidKeys: Set<string>;
  onText: (k: string, v: string) => void;
  onChip: (k: string, v: string) => void;
  onMulti: (k: string, opt: string) => void;
}) {
  return (
    <section className="card" style={{ padding: "var(--space-8)" }}>
      <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
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
            flex: "none",
          }}
        >
          <Icon name={stepDef.icon} size={22} />
        </span>
        <div>
          <h1 className="t-title">{stepDef.title}</h1>
          <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginTop: 4 }}>
            {stepDef.desc}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-5)" }}>
        {stepDef.fields.map((f) => (
          <Field
            key={f.k}
            f={f}
            value={data[f.k]}
            invalid={showErrors && invalidKeys.has(f.k)}
            onText={onText}
            onChip={onChip}
            onMulti={onMulti}
          />
        ))}
      </div>
    </section>
  );
}

function Field({
  f,
  value,
  invalid,
  onText,
  onChip,
  onMulti,
}: {
  f: WizardField;
  value: string | string[] | undefined;
  invalid: boolean;
  onText: (k: string, v: string) => void;
  onChip: (k: string, v: string) => void;
  onMulti: (k: string, opt: string) => void;
}) {
  const span = f.col === 2 ? "span 2" : "span 1";
  const strVal = typeof value === "string" ? value : "";
  const arrVal = Array.isArray(value) ? value : [];

  return (
    <div style={{ gridColumn: span }}>
      <label className="field-label" htmlFor={f.k}>
        {f.label}
        {!f.req && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> · optional</span>}
      </label>

      {(f.type === "text" || f.type === "email" || f.type === "tel" || f.type === "date") && (
        <input
          id={f.k}
          className={`input${invalid ? " invalid" : ""}`}
          type={f.type}
          placeholder={f.ph}
          value={strVal}
          onChange={(e) => onText(f.k, e.target.value)}
        />
      )}

      {f.type === "textarea" && (
        <textarea
          id={f.k}
          className={`textarea${invalid ? " invalid" : ""}`}
          placeholder={f.ph}
          value={strVal}
          onChange={(e) => onText(f.k, e.target.value)}
        />
      )}

      {f.type === "select" && (
        <select
          id={f.k}
          className={`select${invalid ? " invalid" : ""}`}
          value={strVal}
          onChange={(e) => onText(f.k, e.target.value)}
        >
          <option value="">Select…</option>
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {f.type === "chips" && (
        <div className={`chip-group${invalid ? " invalid" : ""}`}>
          {f.options?.map((o) => (
            <button
              type="button"
              key={o}
              className={`chip${strVal === o ? " selected" : ""}`}
              onClick={() => onChip(f.k, o)}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {f.type === "multi" && (
        <div className="chip-group">
          {f.options?.map((o) => (
            <button
              type="button"
              key={o}
              className={`chip${arrVal.includes(o) ? " selected" : ""}`}
              onClick={() => onMulti(f.k, o)}
            >
              {arrVal.includes(o) && <Icon name="check" size={14} />}
              {o}
            </button>
          ))}
        </div>
      )}

      {f.help && <p className="field-help">{f.help}</p>}
      {invalid && <p className="field-error">This field is required.</p>}
    </div>
  );
}

function ReviewStep({
  schema,
  data,
  refId,
  signature,
  consent,
  error,
  submitError,
  submitting,
  onEdit,
  onSignature,
  onConsent,
  onBack,
  onSubmit,
}: {
  schema: ProductSchema;
  data: Values;
  refId: string;
  signature: string;
  consent: boolean;
  error: string | null;
  submitError: string | null;
  submitting: boolean;
  onEdit: (i: number) => void;
  onSignature: (v: string) => void;
  onConsent: (v: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <h1 className="t-title" style={{ marginBottom: "var(--space-2)" }}>
        Review your quote request
      </h1>
      <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
        Check your answers, then sign to authorize us to prepare your rate.
      </p>

      {schema.steps.map((st, i) => (
        <section key={st.id} className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 className="t-heading">{st.title}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(i)}>
              Edit
            </button>
          </div>
          <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3) var(--space-5)" }}>
            {st.fields.map((f) => (
              <div key={f.k} style={{ gridColumn: f.col === 2 ? "span 2" : "span 1" }}>
                <dt className="t-caption" style={{ color: "var(--text-muted)" }}>
                  {cleanLabel(f.label)}
                </dt>
                <dd className="t-body-sm" style={{ color: "var(--text-primary)", marginTop: 2 }}>
                  {displayVal(data[f.k])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {/* Electronic signature */}
      <section className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-4)" }}>
        <h2 className="t-heading" style={{ marginBottom: "var(--space-2)" }}>
          Electronic signature
        </h2>
        <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
          Type your full legal name to sign this quote request.
        </p>
        <input
          className="input"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20 }}
          placeholder="Your full legal name"
          value={signature}
          onChange={(e) => onSignature(e.target.value)}
          aria-label="Electronic signature"
        />
        <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
          Signed {today} · Reference{" "}
          <span className="mono">{refId}</span>
        </p>

        <label
          style={{
            display: "flex",
            gap: "var(--space-3)",
            alignItems: "flex-start",
            marginTop: "var(--space-4)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsent(e.target.checked)}
            style={{ marginTop: 3, width: 18, height: 18, flex: "none" }}
          />
          <span className="t-body-sm" style={{ color: "var(--text-secondary)" }}>
            I confirm the information above is accurate and I authorize K2B Insurance to
            contact me about this request. I understand this is a quote request, not a
            binding policy.
          </span>
        </label>
      </section>

      {(error || submitError) && (
        <div
          role="alert"
          style={{
            background: "var(--red-50)",
            border: "1px solid var(--red-100)",
            color: "var(--text-danger)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            marginBottom: "var(--space-4)",
          }}
          className="t-body-sm"
        >
          {error ?? submitError}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn btn-secondary" onClick={onBack} disabled={submitting}>
          <Icon name="arrowLeft" size={16} />
          Back
        </button>
        <button className="btn btn-gold" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Sign & submit quote"}
        </button>
      </div>
    </>
  );
}

function ThanksStep({
  firstName,
  refId,
  crossSell,
}: {
  firstName: string;
  refId: string;
  crossSell: { label: string; href: string };
}) {
  return (
    <section className="card" style={{ padding: "var(--space-10)", textAlign: "center" }}>
      <span
        style={{
          display: "inline-flex",
          width: 64,
          height: 64,
          borderRadius: "var(--radius-full)",
          background: "var(--green-50)",
          color: "var(--text-success)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-5)",
        }}
      >
        <Icon name="checkCircle" size={34} />
      </span>
      <h1 className="t-title" style={{ marginBottom: "var(--space-2)" }}>
        Thanks{firstName ? `, ${firstName}` : ""} — we&apos;ve got it.
      </h1>
      <p className="mono t-body-sm" style={{ color: "var(--text-muted)", marginBottom: "var(--space-8)" }}>
        Confirmation {refId}
      </p>

      <div
        className="card"
        style={{ padding: "var(--space-6)", textAlign: "left", background: "var(--surface-raised)", marginBottom: "var(--space-8)" }}
      >
        <h2 className="t-overline" style={{ color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
          What happens next
        </h2>
        <ol style={{ margin: 0, paddingLeft: "var(--space-5)", display: "grid", gap: "var(--space-3)" }}>
          <li className="t-body-sm" style={{ color: "var(--text-secondary)" }}>
            A licensed K2B agent reviews your request — usually the same business day.
          </li>
          <li className="t-body-sm" style={{ color: "var(--text-secondary)" }}>
            We shop your coverage across our carriers to find your best rate.
          </li>
          <li className="t-body-sm" style={{ color: "var(--text-secondary)" }}>
            We call or email you with a real quote and answer any questions.
          </li>
        </ol>
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
        <Link href={crossSell.href} className="btn btn-primary">
          {crossSell.label}
        </Link>
      </div>
    </section>
  );
}

// CSV export — byte-for-byte the same shape as the design reference's exportCsv():
// UTF-8 BOM, CRLF line endings, quoted fields with doubled inner quotes.

import type { LeadRecord } from "./submissions";
import { displayAnswer } from "./format";

const HEADER = [
  "Ref ID",
  "Product",
  "Status",
  "Submitted",
  "Name",
  "Phone",
  "Email",
  "Signature",
  "Details",
];

function esc(v: unknown): string {
  return '"' + String(v ?? "").replace(/"/g, '""') + '"';
}

function detailsOf(lead: LeadRecord): string {
  const answers = lead.answers ?? {};
  return lead.schema
    .map((g) => {
      const rows = g.fields
        .map((f) => `${f.label}: ${displayAnswer(answers[f.k])}`)
        .join("; ");
      return `${g.title} — ${rows}`;
    })
    .join(" || ");
}

export function buildCsv(leads: LeadRecord[]): string {
  const lines = [HEADER.map(esc).join(",")];
  for (const r of leads) {
    lines.push(
      [
        r.id,
        r.product,
        r.status,
        new Date(r.submittedAt).toLocaleString("en-US"),
        r.name,
        r.phone,
        r.email,
        r.signature || "",
        detailsOf(r),
      ]
        .map(esc)
        .join(","),
    );
  }
  // UTF-8 BOM + CRLF, matching the prototype's client-side builder.
  return "﻿" + lines.join("\r\n");
}

export function csvFilename(): string {
  return `k2b-leads-${new Date().toISOString().slice(0, 10)}.csv`;
}

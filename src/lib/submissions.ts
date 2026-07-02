// Shared submission types + server-side validation for the quote pipeline.

import { z } from "zod";
import type { ProductSchema, WizardField } from "./quote-schemas";
import type { LeadStatus } from "./products";

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

// Snapshot of a product's schema stored with each lead, so the portal + CSV can
// render every Q&A even if the live schema later changes. Single source of truth
// (label lives only here + the form config, never duplicated per renderer).
export type SchemaGroup = { title: string; fields: { k: string; label: string }[] };
export type SchemaSnapshot = SchemaGroup[];

export interface LeadRecord {
  id: string;
  product: string;
  status: LeadStatus;
  submittedAt: string; // ISO-8601
  name: string;
  phone: string;
  email: string;
  signature: string;
  answers: Answers;
  schema: SchemaSnapshot;
}

export function buildSchemaSnapshot(schema: ProductSchema): SchemaSnapshot {
  return schema.steps.map((st) => ({
    title: st.title,
    fields: st.fields.map((f) => ({ k: f.k, label: f.label })),
  }));
}

/** ref id format from the design reference: `{PREFIX}{5-char}-{year}`. */
export function generateRefId(schema: ProductSchema): string {
  const rand = Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  )
    .join("")
    .toUpperCase();
  return `${schema.refIdPrefix}${rand}-${new Date().getFullYear()}`;
}

function allFields(schema: ProductSchema): WizardField[] {
  return schema.steps.flatMap((s) => s.fields);
}

function isEmpty(v: AnswerValue | undefined): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  return String(v).trim() === "";
}

// Strip parenthetical hints from a label for display, matching the reference's
// `f.label.replace(/\s*\(.*?\)\s*/g,' ').trim()`.
export function cleanLabel(label: string): string {
  return label.replace(/\s*\(.*?\)\s*/g, " ").trim();
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Server-side validation — never trust the client. Checks every required field
 * across the whole schema, that select/chip values are within their options,
 * and that signature + consent are present.
 */
export function validateSubmission(
  schema: ProductSchema,
  answers: Answers,
  signature: string,
  consent: boolean,
): ValidationResult {
  const errors: string[] = [];

  for (const f of allFields(schema)) {
    const val = answers[f.k];
    if (f.req && isEmpty(val)) {
      errors.push(`${cleanLabel(f.label)} is required.`);
      continue;
    }
    if (isEmpty(val) || !f.options) continue;

    // Validate option membership for constrained field types.
    if (f.type === "select" || f.type === "chips") {
      if (typeof val === "string" && !f.options.includes(val)) {
        errors.push(`${cleanLabel(f.label)} has an invalid value.`);
      }
    } else if (f.type === "multi") {
      const arr = Array.isArray(val) ? val : [val];
      for (const item of arr) {
        if (!f.options.includes(item)) {
          errors.push(`${cleanLabel(f.label)} has an invalid value.`);
          break;
        }
      }
    }
  }

  if (!signature || signature.trim() === "") {
    errors.push("An electronic signature is required.");
  }
  if (!consent) {
    errors.push("You must authorize K2B Insurance to contact you.");
  }

  return { ok: errors.length === 0, errors };
}

/** Derive the flattened contact columns the portal indexes on. */
export function deriveContact(answers: Answers): {
  name: string;
  phone: string;
  email: string;
} {
  const s = (k: string) => {
    const v = answers[k];
    return typeof v === "string" ? v.trim() : "";
  };
  const name = [s("firstName"), s("lastName")].filter(Boolean).join(" ").trim();
  return { name, phone: s("phone"), email: s("email") };
}

// Zod shape for the POST /api/submissions body.
export const submissionBodySchema = z.object({
  product: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  signature: z.string(),
  consent: z.boolean(),
});
export type SubmissionBody = z.infer<typeof submissionBodySchema>;

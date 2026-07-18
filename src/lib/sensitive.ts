// Server-only helpers for sensitive submission answers (SSN, driver's license).
// Encrypt before persisting; mask before anything leaves the API by default.
// Full values are only ever returned by the dedicated click-to-reveal endpoint.

import { SENSITIVE_KEYS } from "./products";
import { decryptField, encryptField, maskValue } from "./crypto";
import type { Answers } from "./submissions";

/** Encrypt sensitive keys in-place-ish (returns a new answers object). */
export function encryptSensitiveAnswers(answers: Answers): Answers {
  const out: Answers = { ...answers };
  for (const k of SENSITIVE_KEYS) {
    const v = out[k];
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = encryptField(v.trim());
    }
  }
  return out;
}

/** Decrypt then mask sensitive keys for list/detail/CSV responses. */
export function maskSensitiveAnswers(answers: Answers): Answers {
  const out: Answers = { ...answers };
  for (const k of SENSITIVE_KEYS) {
    const v = out[k];
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = maskValue(decryptField(v), k === "ssn" ? "ssn" : "generic");
    }
  }
  return out;
}

/** Decrypt sensitive keys fully — reveal endpoint only. */
export function revealSensitiveAnswers(
  answers: Answers,
): Partial<Record<(typeof SENSITIVE_KEYS)[number], string>> {
  const out: Partial<Record<(typeof SENSITIVE_KEYS)[number], string>> = {};
  for (const k of SENSITIVE_KEYS) {
    const v = answers[k];
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = decryptField(v);
    }
  }
  return out;
}

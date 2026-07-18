// Field-level encryption for sensitive submission answers (SSN, driver's
// license numbers). AES-256-GCM with a key from ENCRYPTION_KEY (base64,
// 32 bytes). Values are stored as "enc:v1:<iv>:<tag>:<ciphertext>" (base64
// parts) inside the answers JSON; anything not carrying that prefix is
// treated as legacy plaintext and passed through on read.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY is missing or too short (need >= 32 chars). Generate one with: openssl rand -base64 32",
    );
  }
  // Preferred form: base64 of exactly 32 random bytes — use directly.
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 32 && decoded.toString("base64").replace(/=+$/, "") === raw.replace(/=+$/, "")) {
    return decoded;
  }
  // Otherwise derive a 32-byte key from the provided secret string.
  return createHash("sha256").update(raw, "utf8").digest();
}

export function encryptField(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    iv.toString("base64") +
    ":" +
    tag.toString("base64") +
    ":" +
    ct.toString("base64")
  );
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function decryptField(value: string): string {
  if (!isEncrypted(value)) return value; // legacy/plaintext passthrough
  const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Mask a sensitive value for display: keep the last 4 characters. */
export function maskValue(plain: string, kind: "ssn" | "generic" = "generic"): string {
  const chars = plain.replace(/[^A-Za-z0-9]/g, "");
  const last4 = chars.slice(-4) || "····";
  return kind === "ssn" ? `***-**-${last4}` : `••••${last4}`;
}

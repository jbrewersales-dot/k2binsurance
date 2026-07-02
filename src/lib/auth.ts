import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// App-managed agent auth: email + bcrypt-hashed password (see prisma/seed.ts),
// session carried in a signed, httpOnly JWT cookie. No sessionStorage, no
// shared passcode — replaces the prototype's client-side gate.

export const SESSION_COOKIE = "k2b_agent_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

export interface AgentSession {
  sub: string; // agent id
  email: string;
  name: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a strong secret (>= 32 chars).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AgentSession): Promise<string> {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<AgentSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

/** Read + verify the current agent session from the request cookies. */
export async function getSession(): Promise<AgentSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

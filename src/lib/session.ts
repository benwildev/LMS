// Edge-safe session helpers (used by middleware and the server).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tbu_session";

export type SessionPayload = { uid: number; role: "admin" | "student" };

function key() {
  const secret = process.env.SESSION_SECRET || "dev-only-secret-please-set-SESSION_SECRET";
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.uid !== "number") return null;
    return { uid: payload.uid, role: payload.role === "admin" ? "admin" : "student" };
  } catch {
    return null;
  }
}

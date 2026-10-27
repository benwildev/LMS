import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession, verifySession } from "./session";
import { getUserById, type User } from "./data";

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const s = await verifySession(token);
  if (!s) return null;
  return await getUserById(s.uid) ?? null;
}

export async function requireUser(next?: string): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect("/login" + (next ? `?next=${encodeURIComponent(next)}` : ""));
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/admin");
  if (u.role !== "admin") redirect("/dashboard");
  return u;
}

export async function startSession(u: Pick<User, "id" | "role">) {
  const token = await signSession({ uid: u.id, role: u.role });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

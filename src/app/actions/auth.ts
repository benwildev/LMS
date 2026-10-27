"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createUser, getUserAuthByEmail, getUserById, updatePassword, updateProfile } from "@/lib/data";
import { endSession, requireUser, startSession } from "@/lib/auth";

export type FormState = { error?: string; ok?: string; fields?: Record<string, string> };

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = email ? await getUserAuthByEmail(email) : undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return { error: "That email and password don’t match an account.", fields: { email } };
  }
  await startSession(user);
  redirect(safeNext(form.get("next"), user.role === "admin" ? "/admin" : "/dashboard"));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const phone = String(form.get("phone") || "").replace(/[^\d]/g, "");
  const password = String(form.get("password") || "");
  const fields = { name, email, phone };
  if (name.length < 2) return { error: "Please write your full name.", fields };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address doesn’t look right.", fields };
  if (phone && !/^01[3-9]\d{8}$/.test(phone)) return { error: "Phone should be an 11-digit number starting with 01.", fields };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", fields };
  if (await getUserAuthByEmail(email)) return { error: "An account with this email already exists. Sign in instead.", fields };
  const id = await createUser({ name, email, phone, password_hash: bcrypt.hashSync(password, 10) });
  await startSession({ id, role: "student" });
  redirect(safeNext(form.get("next"), "/dashboard"));
}

export async function logout() {
  endSession();
  redirect("/");
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(form.get("name") || "").trim();
  const phone = String(form.get("phone") || "").replace(/[^\d]/g, "");
  const current = String(form.get("current") || "");
  const next = String(form.get("password") || "");
  if (name.length < 2) return { error: "Please write your full name." };
  if (phone && !/^01[3-9]\d{8}$/.test(phone)) return { error: "Phone should be an 11-digit number starting with 01." };
  await updateProfile(user.id, name, phone);
  if (next) {
    if (next.length < 8) return { error: "New password needs at least 8 characters." };
    const full = await getUserAuthByEmail(user.email);
    if (!full) return { error: "Account not found." };
    if (!bcrypt.compareSync(current, full.password_hash)) return { error: "Your current password isn’t right." };
    await updatePassword(user.id, bcrypt.hashSync(next, 10));
  }
  return { ok: next ? "Profile and password saved." : "Profile saved." };
}

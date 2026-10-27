"use client";
import Link from "next/link";
import { useFormState } from "react-dom";
import { login, register } from "@/app/actions/auth";
import Submit from "./Submit";

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useFormState(mode === "login" ? login : register, {});
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} className="form">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "register" && (
        <label className="field">
          <span>Full name</span>
          <input className="input" name="name" autoComplete="name" defaultValue={state.fields?.name} required />
        </label>
      )}
      <label className="field">
        <span>Email</span>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          defaultValue={state.fields?.email}
          required
        />
      </label>
      {mode === "register" && (
        <label className="field">
          <span>Phone (optional)</span>
          <input
            className="input num"
            name="phone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            defaultValue={state.fields?.phone}
          />
          <small>Usually the bKash number you’ll pay from. It fills in at checkout.</small>
        </label>
      )}
      <label className="field">
        <span>Password</span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "register" ? 8 : undefined}
          required
        />
      </label>
      {state.error && (
        <p className="notice notice-bad" role="alert">
          {state.error}
        </p>
      )}
      <Submit className="btn btn-lg" pending={mode === "login" ? "Signing in…" : "Creating…"}>
        {mode === "login" ? "Sign in" : "Create account"}
      </Submit>
      <p className="meta">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link className="link" href={`/register${q}`}>
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have one?{" "}
            <Link className="link" href={`/login${q}`}>
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

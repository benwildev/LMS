"use client";
import { useFormStatus } from "react-dom";

export default function Submit({
  children,
  pending,
  className = "btn",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={busy || rest.disabled} aria-busy={busy} {...rest}>
      {busy ? pending ?? "Working…" : children}
    </button>
  );
}

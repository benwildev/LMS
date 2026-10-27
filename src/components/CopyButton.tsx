"use client";
import { useState } from "react";

export default function CopyButton({ text, className = "copy" }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: the number is still visible to copy by hand */
        }
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

"use client";
import { useState } from "react";
import Icon from "./Icon";

/** Shares the course page (not the lesson, which needs access). */
export default function ShareButton({ path, title }: { path: string; title: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="lv-share"
      onClick={async () => {
        const url = window.location.origin + path;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          }
        } catch {
          /* cancelled */
        }
      }}
    >
      <Icon name="arrow" size={16} />
      {done ? "Link copied" : "Share"}
    </button>
  );
}

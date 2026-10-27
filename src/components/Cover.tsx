"use client";
import { useState } from "react";

/* Calm, distinct grounds for drawn covers; each course keeps the same one. */
const TONES = [
  { bg: "#138a4d", ink: "#ffffff", line: "#2ba264" },
  { bg: "#0b5a33", ink: "#e9f5ee", line: "#1a7146" },
  { bg: "#1d6b62", ink: "#e8f4f2", line: "#2c8176" },
  { bg: "#24262d", ink: "#f1f1f3", line: "#3a3d47" },
  { bg: "#3f7d2a", ink: "#f0f7ec", line: "#55943f" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * A course cover: the admin's image or the video's own frame.
 * With neither, a typographic cover is drawn from the title.
 */
export default function Cover({
  src,
  title,
  meta,
  className = "",
  eager = false,
}: {
  src: string | null;
  title: string;
  meta?: string;
  className?: string;
  eager?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={`cover ${className}`}
        src={src}
        alt={`Cover of ${title}`}
        loading={eager ? "eager" : "lazy"}
        onError={() => setBroken(true)}
      />
    );
  }
  const t = TONES[hash(title) % TONES.length]!;
  const letter = title.trim().charAt(0).toUpperCase() || "P";
  return (
    <div
      className={`cover cover-drawn ${className}`}
      role="img"
      aria-label={`Cover of ${title}`}
      style={{ ["--cv-bg" as string]: t.bg, ["--cv-ink" as string]: t.ink, ["--cv-line" as string]: t.line }}
    >
      <svg className="cover-art" viewBox="0 0 160 90" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <circle cx="132" cy="22" r="54" fill="none" stroke="var(--cv-line)" strokeWidth="1.2" />
        <circle cx="132" cy="22" r="38" fill="none" stroke="var(--cv-line)" strokeWidth="1.2" />
        <circle cx="132" cy="22" r="22" fill="var(--cv-line)" />
      </svg>
      <span className="cover-letter" aria-hidden="true">
        {letter}
      </span>
      <span className="cover-text">
        <span className="cover-title">{title}</span>
        {meta && <span className="cover-meta">{meta}</span>}
      </span>
    </div>
  );
}

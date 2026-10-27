"use client";
import { useEffect } from "react";

/** Staggered entrances for [data-reveal] parts as their section scrolls in. Content stays visible without script. */
export default function Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const group = el.closest("section, footer") ?? document.body;
          const siblings = Array.from(group.querySelectorAll<HTMLElement>("[data-reveal]"));
          el.style.transitionDelay = `${Math.max(0, siblings.indexOf(el)) * 75}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

"use client";
import { useEffect, useState } from "react";

export type Tab = { key: string; label: string; badge?: string; content: React.ReactNode };

/** Tabs under the video. "#quiz" in the address opens the quiz tab. */
export default function LessonTabs({ tabs, initial }: { tabs: Tab[]; initial: string }) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (tabs.some((t) => t.key === h)) {
        setOn(h);
        document.getElementById("tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [tabs]);
  const current = tabs.find((t) => t.key === on) ?? tabs[0]!;
  return (
    <div className="lv-tabs" id="tabs">
      <div className="lv-tablist" role="tablist" aria-label="Lesson">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={t.key === on}
            aria-controls={`panel-${t.key}`}
            className={t.key === on ? "on" : ""}
            onClick={() => setOn(t.key)}
          >
            {t.label}
            {t.badge && <span className="lv-badge">{t.badge}</span>}
          </button>
        ))}
      </div>
      <div className="lv-panel" role="tabpanel" id={`panel-${current.key}`} aria-labelledby={`tab-${current.key}`}>
        {current.content}
      </div>
    </div>
  );
}

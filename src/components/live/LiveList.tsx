import { headers } from "next/headers";
import type { LiveClass } from "@/lib/data";
import { dhakaDateTime, dhakaTime, googleCalendarUrl } from "@/lib/time";
import LiveJoin from "./LiveJoin";

/** Classes for students: date block, title, time, and the right action for now. */
export default function LiveList({
  items,
  showCourse = false,
  empty,
}: {
  items: LiveClass[];
  showCourse?: boolean;
  empty: string;
}) {
  if (!items.length) return <p className="empty">{empty}</p>;
  const h = headers();
  const siteUrl = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`;
  return (
    <ul className="live-list">
      {items.map((l) => {
        const end = new Date(l.starts_at.getTime() + l.duration_min * 60_000);
        const day = l.starts_at.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric" });
        const mon = l.starts_at.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", month: "short" });
        return (
          <li key={l.id}>
            <span className="live-date" aria-hidden="true">
              <b>{day}</b>
              {mon}
            </span>
            <div className="live-info">
              <b>{l.title}</b>
              <small>
                {dhakaDateTime(l.starts_at)} – {dhakaTime(end)}
                {showCourse ? ` · ${l.course_title}` : ""}
              </small>
              {l.description && <p>{l.description}</p>}
            </div>
            <LiveJoin
              startsAt={l.starts_at.toISOString()}
              durationMin={l.duration_min}
              meetUrl={l.meet_url}
              recordingUrl={l.recording_url}
              calendarUrl={googleCalendarUrl({
                title: `${l.title} (${l.course_title})`,
                startsAt: l.starts_at,
                durationMin: l.duration_min,
                details: `Join from your dashboard: ${siteUrl}/learn/${l.course_slug}`,
              })}
            />
          </li>
        );
      })}
    </ul>
  );
}

/** Bangladesh has no daylight saving: Dhaka is always UTC+6. */
const OFFSET = 6 * 3600_000;

/** "2026-10-30T19:30" typed into a datetime-local field, read as Dhaka time. */
export function fromDhakaInput(v: string): Date | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as number[];
  return new Date(Date.UTC(y!, mo! - 1, d!, h!, mi!) - OFFSET);
}

/** The reverse, to fill a datetime-local field. */
export function toDhakaInput(d: Date) {
  return new Date(d.getTime() + OFFSET).toISOString().slice(0, 16);
}

export function dhakaDateTime(d: Date) {
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function dhakaTime(d: Date) {
  return d.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit", hour12: true });
}

export type LiveState = "upcoming" | "soon" | "live" | "ended";
/** The Join button opens 15 minutes before the start and closes at the end. */
export const JOIN_EARLY_MIN = 15;

export function liveState(startsAt: Date, durationMin: number, now = Date.now()): LiveState {
  const start = startsAt.getTime();
  const end = start + durationMin * 60_000;
  if (now >= end) return "ended";
  if (now >= start) return "live";
  if (now >= start - JOIN_EARLY_MIN * 60_000) return "soon";
  return "upcoming";
}

/** "in 3 days", "in 2 h", "in 25 min". */
export function until(d: Date, now = Date.now()) {
  const s = Math.round((d.getTime() - now) / 1000);
  if (s <= 0) return "now";
  if (s < 3600) return `in ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `in ${Math.round(s / 3600)} h`;
  const days = Math.round(s / 86400);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/** A link that opens Google Calendar with the class filled in. */
export function googleCalendarUrl(o: { title: string; startsAt: Date; durationMin: number; details: string }) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(o.startsAt.getTime() + o.durationMin * 60_000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: o.title,
    dates: `${fmt(o.startsAt)}/${fmt(end)}`,
    details: o.details,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

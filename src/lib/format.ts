const nf = new Intl.NumberFormat("en-IN");

export function taka(n: number) {
  return n === 0 ? "Free" : `৳${nf.format(n)}`;
}
export function num(n: number) {
  return nf.format(n);
}
export function minutes(total: number) {
  if (!total) return "—";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? (m ? `${h} h ${m} m` : `${h} h`) : `${m} m`;
}
/** Shows a timestamp in Dhaka time. */
export function when(date?: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function ago(date?: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date).getTime();
  const s = Math.max(0, (Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const days = Math.floor(s / 86400);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "course"
  );
}
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

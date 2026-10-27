import Link from "next/link";

/** Sub-pages of one course in admin. */
export default function CourseTabs({
  id,
  on,
  live,
  materials,
}: {
  id: number;
  on: "edit" | "live" | "materials";
  live: number;
  materials: number;
}) {
  const tabs = [
    { key: "edit", href: `/admin/courses/${id}`, label: "Lessons & details" },
    { key: "live", href: `/admin/courses/${id}/live`, label: "Live classes", n: live },
    { key: "materials", href: `/admin/courses/${id}/materials`, label: "Materials", n: materials },
  ];
  return (
    <nav className="tabs course-tabs" aria-label="Course sections">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} className={on === t.key ? "on" : ""} aria-current={on === t.key ? "page" : undefined}>
          {t.label}
          {t.n !== undefined && <span className="num">{t.n}</span>}
        </Link>
      ))}
    </nav>
  );
}

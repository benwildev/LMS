"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

export type NavItem = { href: string; label: string; icon: string; count?: number; exact?: boolean };

function isOn(path: string, it: NavItem) {
  return it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
}

/** The text pills in the top bar. */
export function PillNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="pillnav" aria-label="Sections">
      {items.map((it) => {
        const on = isOn(path, it);
        return (
          <Link key={it.href} href={it.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
            {it.label}
            {it.count ? <span className="pn-count">{it.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** The icon rail on the left. */
export function RailNav({ items, label }: { items: NavItem[]; label: string }) {
  const path = usePathname();
  return (
    <nav className="rail-group" aria-label={label}>
      {items.map((it) => {
        const on = isOn(path, it);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={on ? "on" : ""}
            aria-current={on ? "page" : undefined}
            aria-label={it.label}
            data-tip={it.label}
          >
            <Icon name={it.icon} size={19} />
            {it.count ? <span className="rail-dot" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export default PillNav;

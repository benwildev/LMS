import Link from "next/link";
import Icon from "./Icon";
import Mark from "./Mark";
import { PillNav, RailNav, type NavItem } from "./NavLinks";
import { logout } from "@/app/actions/auth";
import type { User } from "@/lib/data";
import { initials } from "@/lib/format";

export function Avatar({ name, id, size }: { name: string; id: number; size?: number }) {
  const h = (id * 137) % 360;
  return (
    <span
      className="avatar"
      style={{ ["--h" as string]: h, ...(size ? { width: size, height: size } : {}) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export default function AppShell({
  user,
  siteName,
  nav,
  rail,
  alerts = 0,
  alertsHref,
  searchHref,
  menu,
  children,
}: {
  user: User;
  siteName: string;
  nav: NavItem[];
  rail?: NavItem[];
  alerts?: number;
  alertsHref: string;
  searchHref: string;
  menu?: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="app shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Mark size={18} />
          </span>
          {siteName}
        </Link>
        <PillNav items={nav} />
        <div className="top-tools">
          <Link href={searchHref} className="round-btn" aria-label="Search">
            <Icon name="search" size={18} />
          </Link>
          <Link href={alertsHref} className="round-btn" aria-label={alerts ? `${alerts} waiting` : "Notifications"}>
            <Icon name="bell" size={18} />
            {alerts > 0 && <span className="bell-dot">{alerts > 9 ? "9+" : alerts}</span>}
          </Link>
          <details className="account">
            <summary aria-label="Account menu">
              <Avatar name={user.name} id={user.id} size={40} />
              <Icon name="chevron" size={14} />
            </summary>
            <div className="account-menu">
              <p>
                <b>{user.name}</b>
                <small>{user.email}</small>
              </p>
              {(menu ?? []).map((m) => (
                <Link key={m.href} href={m.href}>
                  {m.label}
                </Link>
              ))}
              <Link href="/">View the site</Link>
              <form action={logout}>
                <button type="submit">Sign out</button>
              </form>
            </div>
          </details>
        </div>
      </header>

      <aside className="rail" aria-label="Quick navigation">
        <RailNav items={nav} label="Sections" />
        {rail && rail.length > 0 && <RailNav items={rail} label="More" />}
        <div className="rail-group rail-bottom">
          <Link href="/" aria-label="View the site" data-tip="View the site">
            <Icon name="site" size={19} />
          </Link>
          <form action={logout}>
            <button type="submit" aria-label="Sign out" data-tip="Sign out">
              <Icon name="out" size={19} />
            </button>
          </form>
        </div>
      </aside>

      <main className="canvas">{children}</main>
    </div>
  );
}

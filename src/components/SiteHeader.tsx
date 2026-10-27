import Link from "next/link";
import Icon from "./Icon";
import type { Settings, User } from "@/lib/data";

/** The open-book mark, outlined, in the brand green. */
export function BookMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="ed-mark">
      <path
        d="M3 8.5c4.3-1.3 8.6-.8 13 1.7v15.5c-4.4-2.5-8.7-3-13-1.7zM29 8.5c-4.3-1.3-8.6-.8-13 1.7v15.5c4.4-2.5 8.7-3 13-1.7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 13.2c2.4-.4 4.6 0 6.5 1M7 17.4c2.4-.4 4.6 0 6.5 1M25 13.2c-2.4-.4-4.6 0-6.5 1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Thin dark bar above the header: the announcement and how to reach you. */
export function TopBar({ s }: { s: Settings }) {
  if (!s.announcement) return null;
  return (
    <div className="ed-topbar">
      <div className="ed-wrap ed-topbar-in">
        <p>{s.announcement}</p>
        <ul>
          {s.support_phone && (
            <li>
              <Icon name="phone" size={14} />
              <a href={`tel:${s.support_phone}`}>{s.support_phone}</a>
            </li>
          )}
          {s.support_email && (
            <li className="hide-sm">
              <Icon name="mail" size={14} />
              <a href={`mailto:${s.support_email}`}>{s.support_email}</a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function SiteHeader({ siteName, user }: { siteName: string; user: User | null }) {
  return (
    <div className="ed-header-wrap">
      <header className="ed-header ed-wrap">
        <Link href="/" className="ed-logo">
          <BookMark />
          {siteName}
        </Link>
        <nav className="ed-nav" aria-label="Main">
          <Link href="/">Home</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/#live">Live classes</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <div className="ed-auth">
          {user ? (
            <Link className="ed-btn ed-btn-solid" href={user.role === "admin" ? "/admin" : "/dashboard"}>
              {user.role === "admin" ? "Admin" : "My dashboard"}
            </Link>
          ) : (
            <>
              <Link href="/login" className="ed-signin">
                Sign in
              </Link>
              <Link href="/register" className="ed-btn ed-btn-line">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>
    </div>
  );
}

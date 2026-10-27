import Link from "next/link";
import Mark from "./Mark";
import type { Settings } from "@/lib/data";

export default function SiteFooter({ s }: { s: Settings }) {
  const wa = s.support_phone
    ? `https://wa.me/88${s.support_phone.replace(/[^\d]/g, "").replace(/^88/, "")}`
    : null;
  return (
    <footer className="site-foot">
      <div className="foot-card">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="brand">
              <span className="brand-mark">
                <Mark size={18} />
              </span>
              {s.site_name}
            </Link>
            <p>{s.tagline}</p>
          </div>
          <div>
            <h4>Learn</h4>
            <ul>
              <li>
                <Link href="/courses">All courses</Link>
              </li>
              <li>
                <Link href="/#live">Live classes</Link>
              </li>
              <li>
                <Link href="/#how">How it works</Link>
              </li>
              <li>
                <Link href="/#faq">FAQ</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li>
                <Link href="/register">Create an account</Link>
              </li>
              <li>
                <Link href="/login">Sign in</Link>
              </li>
              <li>
                <Link href="/dashboard">My dashboard</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li>
                <Link href="/#faq">Questions &amp; answers</Link>
              </li>
              {wa && (
                <li>
                  <a href={wa}>WhatsApp {s.support_phone}</a>
                </li>
              )}
              {s.support_email && (
                <li>
                  <a href={`mailto:${s.support_email}`}>{s.support_email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="foot-legal">
          <span>
            © {new Date().getFullYear()} {s.site_name}
          </span>
          <span>
            <Link href="/courses">Courses</Link> · <Link href="/#faq">Help</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

import { requireUser } from "@/lib/auth";
import { getSettings, paymentCounts, paymentsForUser } from "@/lib/data";
import AppShell from "@/components/AppShell";
import type { NavItem } from "@/components/NavLinks";

/** Lessons open inside the same shell as the dashboards. */
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const s = await getSettings();
  let nav: NavItem[];
  let alerts = 0;
  if (user.role === "admin") {
    alerts = (await paymentCounts()).pending;
    nav = [
      { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
      { href: "/admin/payments", label: "Payments", icon: "card", count: alerts },
      { href: "/admin/courses", label: "Courses", icon: "courses" },
        { href: "/admin/live", label: "Live classes", icon: "calendar" },
      { href: "/admin/students", label: "Students", icon: "students" },
    ];
  } else {
    alerts = (await paymentsForUser(user.id)).filter((p) => p.status === "pending").length;
    nav = [
      { href: "/dashboard", label: "Dashboard", icon: "grid", exact: true },
      { href: "/learn", label: "Learning", icon: "learn" },
      { href: "/dashboard/payments", label: "Payments", icon: "card" },
      { href: "/dashboard/profile", label: "Profile", icon: "user" },
    ];
  }
  return (
    <AppShell
      user={user}
      siteName={s.site_name}
      alerts={alerts}
      alertsHref={user.role === "admin" ? "/admin/payments" : "/dashboard/payments"}
      searchHref="/#courses"
      nav={nav}
      rail={[{ href: "/#courses", label: "Browse courses", icon: "book" }]}
      menu={user.role === "admin" ? [{ href: "/admin/settings", label: "Settings" }] : [{ href: "/dashboard/profile", label: "Profile" }]}
    >
      {children}
    </AppShell>
  );
}

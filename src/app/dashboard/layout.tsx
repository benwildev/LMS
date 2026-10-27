import { requireUser } from "@/lib/auth";
import { getSettings, paymentsForUser } from "@/lib/data";
import AppShell from "@/components/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const [s, payments] = await Promise.all([getSettings(), paymentsForUser(user.id)]);
  const waiting = payments.filter((p) => p.status === "pending").length;
  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "grid", exact: true },
    { href: "/learn", label: "Learning", icon: "learn" },
    { href: "/dashboard/payments", label: "Payments", icon: "card" },
    { href: "/dashboard/profile", label: "Profile", icon: "user" },
  ];
  if (user.role === "admin") nav.push({ href: "/admin", label: "Admin", icon: "settings" });
  return (
    <AppShell
      user={user}
      siteName={s.site_name}
      alerts={waiting}
      alertsHref="/dashboard/payments"
      searchHref="/#courses"
      nav={nav}
      rail={[{ href: "/#courses", label: "Browse courses", icon: "book" }]}
      menu={[{ href: "/dashboard/profile", label: "Profile" }]}
    >
      {children}
    </AppShell>
  );
}

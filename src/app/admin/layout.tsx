import { requireAdmin } from "@/lib/auth";
import { getSettings, paymentCounts } from "@/lib/data";
import AppShell from "@/components/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [s, counts] = await Promise.all([getSettings(), paymentCounts()]);
  return (
    <AppShell
      user={user}
      siteName={s.site_name}
      alerts={counts.pending}
      alertsHref="/admin/payments"
      searchHref="/admin/payments?status=all"
      nav={[
        { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
        { href: "/admin/payments", label: "Payments", icon: "card", count: counts.pending },
        { href: "/admin/courses", label: "Courses", icon: "courses" },
        { href: "/admin/live", label: "Live classes", icon: "calendar" },
        { href: "/admin/students", label: "Students", icon: "students" },
      ]}
      rail={[{ href: "/admin/settings", label: "Settings", icon: "settings" }]}
      menu={[{ href: "/admin/settings", label: "Settings" }]}
    >
      {children}
    </AppShell>
  );
}

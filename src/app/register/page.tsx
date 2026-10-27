import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account" };

export default async function Page({ searchParams }: { searchParams: { next?: string } }) {
  const user = await getCurrentUser();
  const next = searchParams.next && searchParams.next.startsWith("/") ? searchParams.next : undefined;
  if (user) redirect(next ?? (user.role === "admin" ? "/admin" : "/dashboard"));
  const s = await getSettings();
  return (
    <>
      <SiteHeader siteName={s.site_name} user={null} />
      <main className="page">
        <section className="grid12 split">
          <div className="split-left">
            <h1 className="page-title">Make an account to start learning.</h1>
            <p className="lead">It takes a minute. You’ll need it to pay for a course and to keep your progress.</p>
          </div>
          <div className="split-right">
            <div className="panel">
              <AuthForm mode="register" next={next} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter s={s} />
    </>
  );
}

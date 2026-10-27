import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, listPublishedCourses } from "@/lib/data";
import { toCard } from "@/lib/cards";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseGrid from "@/components/CourseGrid";

export const metadata: Metadata = { title: "All courses" };

export default async function Courses({ searchParams }: { searchParams: { q?: string; topic?: string } }) {
  const [user, s, courses] = await Promise.all([getCurrentUser(), getSettings(), listPublishedCourses()]);
  return (
    <div className="ed">
      <SiteHeader siteName={s.site_name} user={user} />
      <section className="ed-section ed-courses-page">
        <div className="ed-wrap">
          <CourseGrid
            courses={courses.map(toCard)}
            initialQuery={searchParams.q ?? ""}
            initialTopic={searchParams.topic ?? ""}
            title={
              <>
                All <span className="ed-hl">courses</span>
              </>
            }
          />
        </div>
      </section>
      <SiteFooter s={s} />
    </div>
  );
}

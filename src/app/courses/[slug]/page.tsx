import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { courseExtrasCount, getCourseBySlug, getSettings, isEnrolled, listLessons, nextLiveForCourse, pendingPaymentFor } from "@/lib/data";
import { dhakaDateTime } from "@/lib/time";
import { minutes, taka } from "@/lib/format";
import { coverFor } from "@/lib/video";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import VideoPlayer from "@/components/VideoPlayer";
import Cover from "@/components/Cover";
import Submit from "@/components/Submit";
import { enrollFree } from "@/app/actions/student";

type Props = { params: { slug: string }; searchParams: { preview?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCourseBySlug(params.slug);
  return c ? { title: c.title, description: c.subtitle || c.description.slice(0, 150) } : {};
}

export default async function CoursePage({ params, searchParams }: Props) {
  const course = await getCourseBySlug(params.slug);
  const user = await getCurrentUser();
  if (!course || (!course.published && user?.role !== "admin")) notFound();
  const s = await getSettings();
  const [lessons, extras, nextLive] = await Promise.all([
    listLessons(course.id),
    courseExtrasCount(course.id),
    nextLiveForCourse(course.id),
  ]);
  const enrolled = user ? user.role === "admin" || await isEnrolled(user.id, course.id) : false;
  const pending = user && !enrolled ? await pendingPaymentFor(user.id, course.id) : undefined;

  const previews = lessons.filter((l) => l.is_preview && l.video_url);
  const chosen = previews.find((l) => String(l.id) === searchParams.preview);
  const previewUrl = chosen?.video_url || course.preview_url || previews[0]?.video_url || "";
  const previewTitle = chosen?.title || (course.preview_url ? `${course.title}: preview` : previews[0]?.title) || course.title;
  const questionTotal = lessons.reduce((n, l) => n + l.question_count, 0);

  let action: React.ReactNode;
  if (enrolled) {
    action = (
      <Link className="btn btn-lg" href={`/learn/${course.slug}`}>
        Continue learning
      </Link>
    );
  } else if (pending) {
    action = (
      <p className="notice">
        Your payment (TrxID {pending.trx_id}) is being checked. This page will open the lessons as soon as it’s approved.
      </p>
    );
  } else if (course.price === 0) {
    action = user ? (
      <form action={enrollFree.bind(null, course.id)}>
        <Submit className="btn btn-lg" pending="Opening…">
          Start for free
        </Submit>
      </form>
    ) : (
      <Link className="btn btn-lg" href={`/register?next=/courses/${course.slug}`}>
        Create an account to start
      </Link>
    );
  } else {
    action = (
      <Link className="btn btn-lg" href={`/checkout/${course.slug}`}>
        Buy with bKash
      </Link>
    );
  }

  return (
    <>
      <SiteHeader siteName={s.site_name} user={user} />
      <main className="page">
        {!course.published && <p className="notice">Draft: only admins can see this page until it’s published.</p>}
        <section className="grid12 course-top">
          <div className="course-intro">
            <h1 className="page-title">{course.title}</h1>
            {course.subtitle && <p className="lead">{course.subtitle}</p>}
            <p className="meta">
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
              {course.total_min ? ` · ${minutes(course.total_min)} of video` : ""}
              {questionTotal ? ` · ${questionTotal} questions` : ""}
              {course.language ? ` · ${course.language}` : ""}
              {course.level ? ` · ${course.level}` : ""}
              {extras.materials ? ` · ${extras.materials} downloadable ${extras.materials === 1 ? "material" : "materials"}` : ""}
            </p>
            {nextLive && (
              <p className="live-promo">
                <span className="live-dot" aria-hidden="true" />
                Includes live classes · next: <b>{nextLive.title}</b>, {dhakaDateTime(nextLive.starts_at)}
                {enrolled ? "" : " (the link is shared with enrolled students)"}
              </p>
            )}
            <div className="buy">
              {!enrolled && <span className="price num">{taka(course.price)}</span>}
              {action}
            </div>
            {!enrolled && course.price > 0 && (
              <p className="meta">One payment by bKash Send Money. Access for as long as the course is on {s.site_name}.</p>
            )}
          </div>
          <figure className="course-media">
            {previewUrl ? (
              <VideoPlayer key={previewUrl} url={previewUrl} title={previewTitle} />
            ) : (
              <Cover src={coverFor(course, course.first_video ?? undefined)} title={course.title} eager />
            )}
            {previewUrl && <figcaption className="meta">Free to watch: {previewTitle}</figcaption>}
          </figure>
        </section>

        <section className="grid12 course-body">
          <div className="course-about prose">
            <h2>About this course</h2>
            {(course.description || "The teacher hasn’t written a description yet.")
              .split(/\n{2,}/)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
          <div className="course-lessons">
            <h2>Lessons</h2>
            {lessons.length === 0 ? (
              <p className="meta">Lessons are being added.</p>
            ) : (
              <ol className="lesson-rows">
                {lessons.map((l) => (
                  <li key={l.id}>
                    {l.is_preview && l.video_url ? (
                      <Link className="t" href={`/courses/${course.slug}?preview=${l.id}`} scroll={false}>
                        {l.title}
                      </Link>
                    ) : (
                      <span className="t">{l.title}</span>
                    )}
                    <span className="d num">{l.duration_min ? minutes(l.duration_min) : "—"}</span>
                    <span className="sub">
                      {l.question_count
                        ? `${l.question_count} ${l.question_count === 1 ? "question" : "questions"} to pass`
                        : "No questions"}
                      {l.is_preview ? " · free preview" : ""}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </main>
      <SiteFooter s={s} />
    </>
  );
}

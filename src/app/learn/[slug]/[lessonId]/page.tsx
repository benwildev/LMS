import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getCourseBySlug, isEnrolled, listLessons, listLiveForCourse, listMaterials, listQuestions, progressForCourse } from "@/lib/data";
import { liveState } from "@/lib/time";
import LiveList from "@/components/live/LiveList";
import MaterialList from "@/components/live/MaterialList";
import { minutes } from "@/lib/format";
import VideoPlayer from "@/components/VideoPlayer";
import Icon from "@/components/Icon";
import ShareButton from "@/components/ShareButton";
import Quiz from "./Quiz";
import LessonTabs from "./LessonTabs";

type Props = { params: { slug: string; lessonId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCourseBySlug(params.slug);
  return { title: c ? c.title : "Lesson" };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function LessonPage({ params }: Props) {
  const user = await requireUser(`/learn/${params.slug}/${params.lessonId}`);
  const course = await getCourseBySlug(params.slug);
  if (!course) notFound();
  const admin = user.role === "admin";
  if (!admin && !(await isEnrolled(user.id, course.id))) redirect(`/courses/${course.slug}`);

  const [lessons, progress, materials, live] = await Promise.all([
    listLessons(course.id),
    progressForCourse(user.id, course.id),
    listMaterials(course.id),
    listLiveForCourse(course.id),
  ]);
  const idx = lessons.findIndex((l) => String(l.id) === params.lessonId);
  if (idx < 0) redirect(`/learn/${course.slug}`);
  const done = (i: number) => !!progress.get(lessons[i]!.id)?.completed_at;
  const open = (i: number) => admin || i === 0 || done(i - 1);
  if (!open(idx)) redirect(`/learn/${course.slug}`);

  const lesson = lessons[idx]!;
  const questions = (await listQuestions(lesson.id)).map((q) => ({ id: q.id, prompt: q.prompt, options: q.options }));
  const mine = progress.get(lesson.id);
  const doneCount = lessons.filter((_, i) => done(i)).length;
  const pct = Math.round((doneCount / lessons.length) * 100);
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];
  const passedHere = done(idx);
  const totalQuestions = lessons.reduce((a, l) => a + l.question_count, 0);
  const needed = Math.ceil((questions.length * lesson.pass_percent) / 100);
  const nextOpen = next && (admin || passedHere);

  // This lesson's materials first, then the ones for the whole course, then other lessons'.
  const lessonMats = materials.filter((m) => m.lesson_id === lesson.id);
  const courseMats = materials.filter((m) => m.lesson_id === null);
  const otherMats = materials.filter((m) => m.lesson_id !== null && m.lesson_id !== lesson.id);
  const now = Date.now();
  const liveNext = live.filter((l) => liveState(l.starts_at, l.duration_min, now) !== "ended");
  const livePast = live.filter((l) => liveState(l.starts_at, l.duration_min, now) === "ended" && l.recording_url).reverse();

  const materialsTab = (
    <div className="lv-overview">
      {lessonMats.length > 0 && (
        <section>
          <h3>For this lesson</h3>
          <MaterialList items={lessonMats} empty="" />
        </section>
      )}
      <section>
        <h3>For the whole course</h3>
        <MaterialList items={courseMats} empty="No course-wide materials yet." />
      </section>
      {otherMats.length > 0 && (
        <section>
          <h3>From other lessons</h3>
          <MaterialList items={otherMats} empty="" />
        </section>
      )}
    </div>
  );

  const liveTab = (
    <div className="lv-overview">
      <section>
        <h3>Coming up</h3>
        <LiveList items={liveNext} empty="No live classes scheduled for this course right now." />
      </section>
      {livePast.length > 0 && (
        <section>
          <h3>Recordings</h3>
          <LiveList items={livePast} empty="" />
        </section>
      )}
    </div>
  );

  const overview = (
    <div className="lv-overview">
      <section>
        <h3>About this lesson</h3>
        <p className="lv-text">{lesson.description || "Watch the video, then answer the questions in the Quiz tab to open the next lesson."}</p>
      </section>
      <section>
        <h3>About the course</h3>
        {(course.description || course.subtitle || "No description yet.").split(/\n{2,}/).map((p, i) => (
          <p key={i} className="lv-text">
            {p}
          </p>
        ))}
      </section>
      <section>
        <h3>What you’ll go through</h3>
        <ul className="lv-learn">
          {lessons.map((l, i) => (
            <li key={l.id} className={done(i) ? "is-done" : ""}>
              <Icon name="check" size={16} />
              {l.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  const quiz = (
    <Quiz
      // A new key when questions are added or removed, so the quiz never keeps answers for an old list.
      key={`${lesson.id}:${questions.map((q) => q.id).join(",")}`}
      lessonId={lesson.id}
      questions={questions}
      passPercent={lesson.pass_percent}
      best={mine?.completed_at ? mine.score : null}
      attempts={mine?.attempts ?? 0}
      nextHref={next ? `/learn/${course.slug}/${next.id}` : null}
      courseDoneHref="/dashboard"
    />
  );

  return (
    <div className="lv">
      <nav className="lv-crumbs" aria-label="Breadcrumb">
        <Icon name="learn" size={16} />
        <Link href={admin ? "/admin/courses" : "/dashboard"}>{admin ? "Courses" : "My courses"}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/courses/${course.slug}`}>{course.title}</Link>
        <span aria-hidden="true">/</span>
        <b>Lesson {idx + 1}</b>
      </nav>

      <div className="lv-title">
        <Link href={admin ? `/admin/courses/${course.id}` : "/dashboard"} className="lv-back" aria-label="Back">
          <Icon name="back" size={18} />
        </Link>
        <div className="lv-title-text">
          <h1>
            {course.title}
            {course.level && <span className="lv-tag">{course.level}</span>}
          </h1>
          <ul className="lv-meta">
            <li>
              <Icon name="learn" size={16} />
              {lessons.length} lessons
            </li>
            {course.total_min > 0 && (
              <li>
                <Icon name="calendar" size={16} />
                {minutes(course.total_min)}
              </li>
            )}
            {totalQuestions > 0 && (
              <li>
                <Icon name="check" size={16} />
                {totalQuestions} quiz questions
              </li>
            )}
          </ul>
        </div>
        <div className="lv-actions">
          <ShareButton path={`/courses/${course.slug}`} title={course.title} />
          {nextOpen ? (
            <Link className="btn" href={`/learn/${course.slug}/${next!.id}`}>
              Next lesson
              <Icon name="next" size={16} />
            </Link>
          ) : !next && passedHere ? (
            <Link className="btn" href="/dashboard">
              <Icon name="check" size={16} />
              Course complete
            </Link>
          ) : (
            <a className="btn" href="#quiz">
              <Icon name="lock" size={16} />
              {questions.length ? "Pass the quiz to continue" : "Mark as done to continue"}
            </a>
          )}
        </div>
      </div>

      <div className="lv-grid">
        <div className="lv-main">
          <div className="lv-video">
            <VideoPlayer key={lesson.id} url={lesson.video_url} title={lesson.title} poster={course.thumbnail_url || null} />
          </div>

          <div className="lv-now">
            <div>
              <p>
                Lesson {idx + 1} of {lessons.length}
                {lesson.duration_min ? ` · ${lesson.duration_min} min` : ""}
                {passedHere ? " · passed" : ""}
              </p>
              <h2>{lesson.title}</h2>
            </div>
            <div className="lv-step">
              {prev ? (
                <Link href={`/learn/${course.slug}/${prev.id}`} className="round-btn" aria-label="Previous lesson">
                  <Icon name="back" size={18} />
                </Link>
              ) : (
                <span className="round-btn is-off" aria-hidden="true">
                  <Icon name="back" size={18} />
                </span>
              )}
              {nextOpen ? (
                <Link href={`/learn/${course.slug}/${next!.id}`} className="round-btn" aria-label="Next lesson">
                  <Icon name="next" size={18} />
                </Link>
              ) : (
                <span className="round-btn is-off" aria-hidden="true" title="Pass this lesson first">
                  <Icon name="next" size={18} />
                </span>
              )}
            </div>
          </div>

          <div id="quiz">
            <LessonTabs
              initial={questions.length || !passedHere ? "quiz" : "overview"}
              tabs={[
                {
                  key: "quiz",
                  label: "Quiz",
                  badge: questions.length ? `${questions.length}` : undefined,
                  content: quiz,
                },
                { key: "overview", label: "Overview", content: overview },
                {
                  key: "materials",
                  label: "Materials",
                  badge: materials.length ? `${materials.length}` : undefined,
                  content: materialsTab,
                },
                {
                  key: "live",
                  label: "Live classes",
                  badge: liveNext.length ? `${liveNext.length}` : undefined,
                  content: liveTab,
                },
              ]}
            />
          </div>
        </div>

        <aside className="lv-side">
          <section className="lv-card">
            <header className="lv-card-head">
              <h2>Course content</h2>
              <span className="num">
                {doneCount}/{lessons.length} passed
              </span>
            </header>
            <ol className="lv-lessons">
              {lessons.map((l, i) => {
                const state = done(i) ? "done" : open(i) ? "open" : "lock";
                const current = l.id === lesson.id;
                const row = (
                  <>
                    <span className={`lv-dot lv-${state}`} aria-hidden="true">
                      {state === "done" ? <Icon name="check" size={12} /> : state === "lock" ? <Icon name="lock" size={13} /> : null}
                    </span>
                    <span className="lv-l-title">
                      <span className="num">{pad(i + 1)}:</span> {l.title}
                      <span className="sr-only">{state === "done" ? " (passed)" : state === "lock" ? " (locked)" : ""}</span>
                    </span>
                    <span className="lv-l-min num">{l.duration_min ? `${l.duration_min}min` : ""}</span>
                  </>
                );
                return (
                  <li key={l.id} className={current ? "is-current" : ""}>
                    {state === "lock" ? (
                      <span className="lv-l-row is-locked" title="Pass the lesson before to open this one">
                        {row}
                      </span>
                    ) : (
                      <Link
                        href={`/learn/${course.slug}/${l.id}`}
                        className="lv-l-row"
                        aria-current={current ? "page" : undefined}
                      >
                        {row}
                      </Link>
                    )}
                    {current && (
                      <ul className="lv-sub">
                        <li>
                          <Icon name="learn" size={15} />
                          Video
                          <span>{l.duration_min ? `${l.duration_min} min` : "—"}</span>
                        </li>
                        <li>
                          <Icon name="check" size={15} />
                          {questions.length ? `Quiz · ${needed} of ${questions.length} to pass` : "Mark as done"}
                          <span>{passedHere ? `${mine?.score ?? 100}%` : mine?.attempts ? `${mine.attempts} tries` : "to do"}</span>
                        </li>
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          {liveNext[0] && (
            <section className="lv-card lv-live">
              <header className="lv-card-head">
                <h2>Next live class</h2>
                <a href="#live" className="lv-see">
                  All {liveNext.length}
                </a>
              </header>
              <div className="lv-live-body">
                <LiveList items={[liveNext[0]]} empty="" />
              </div>
            </section>
          )}

          <section className="lv-card lv-progress">
            <header className="lv-card-head">
              <h2>Your progress</h2>
              <span className={`badge${pct === 100 ? "" : " badge-grey"}`}>{pct === 100 ? "Complete" : `${pct}%`}</span>
            </header>
            <div className="lv-bar" aria-label={`${pct}% of lessons passed`}>
              <i style={{ width: `${pct}%` }} />
            </div>
            <dl className="lv-stats">
              <div>
                <dt>Lessons passed</dt>
                <dd className="num">
                  {doneCount}
                  <small>/{lessons.length}</small>
                </dd>
              </div>
              <div>
                <dt>This lesson</dt>
                <dd className="num">{passedHere ? `${mine?.score ?? 100}%` : <small>not passed</small>}</dd>
              </div>
            </dl>
            {next && (
              <p className="lv-next">
                Up next: <b>{next.title}</b>
                {!nextOpen && " · opens when you pass this lesson"}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, homepageData, listPublishedCourses, publicStats } from "@/lib/data";
import { num } from "@/lib/format";
import { coverFor } from "@/lib/video";
import { toCard } from "@/lib/cards";
import { dhakaTime } from "@/lib/time";
import SiteHeader, { TopBar } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Cover from "@/components/Cover";
import CourseGrid from "@/components/CourseGrid";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";

/** A hand-drawn underline under the highlighted words. */
function Swoosh() {
  return (
    <svg className="ed-swoosh" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 10C40 3 120 1 198 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 13C80 8 130 7 170 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Dashes({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${6 + i * 10} ${48 - i * 4}l8 -12`} stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <path key={`b${i}`} d={`M${10 + i * 11} ${26 - i * 4}l7 -10`} stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** Splits the headline so its last two words get the green highlight. */
function headline(t: string) {
  const words = t.trim().split(/\s+/);
  if (words.length < 3) return { lead: "", hl: t };
  return { lead: words.slice(0, -2).join(" "), hl: words.slice(-2).join(" ") };
}

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

const TOPIC_ICONS = ["book", "learn", "check", "list", "students", "calendar"];

export default async function Home() {
  const [user, s, courses, stats, home] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    listPublishedCourses(),
    publicStats(),
    homepageData(),
  ]);
  const featured = [...courses].sort((a, b) => b.student_count - a.student_count)[0];
  const totalLessons = courses.reduce((a, c) => a + c.lesson_count, 0);
  const totalQuestions = courses.reduce((a, c) => a + c.question_count, 0);
  const h = headline(s.hero_title);
  const nextLive = home.live[0];

  return (
    <div className="ed">
      <Reveal />
      <TopBar s={s} />

      {/* ---------- Hero ---------- */}
      <section className="ed-hero">
        <SiteHeader siteName={s.site_name} user={user} />
        <div className="ed-wrap ed-hero-grid">
          <div className="ed-hero-copy">
            <Dashes className="ed-dash ed-dash-a" />
            <p className="ed-kicker">Learn biology online</p>
            <h1>
              {h.lead}{" "}
              <span className="ed-hl">
                {h.hl}
                <Swoosh />
              </span>
            </h1>
            <p className="ed-lead">{s.hero_subtitle}</p>

            <form action="/courses" className="ed-hero-search" role="search">
              <Icon name="search" size={18} />
              <label className="sr-only" htmlFor="hero-q">
                Search courses
              </label>
              <input id="hero-q" name="q" type="search" placeholder="What do you want to learn? e.g. Genetics" />
              <button type="submit" className="ed-btn ed-btn-solid">
                Search
              </button>
            </form>

            {courses.length > 0 && (
              <dl className="ed-hero-stats">
                {stats.learners > 0 && (
                  <div>
                    <dt>Students learning</dt>
                    <dd className="num">{num(stats.learners)}</dd>
                  </div>
                )}
                <div>
                  <dt>Courses</dt>
                  <dd className="num">{num(courses.length)}</dd>
                </div>
                <div>
                  <dt>Video lessons</dt>
                  <dd className="num">{num(totalLessons)}</dd>
                </div>
                {totalQuestions > 0 && (
                  <div>
                    <dt>Quiz questions</dt>
                    <dd className="num">{num(totalQuestions)}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          <div className="ed-hero-art">
            <span className="ed-blob" aria-hidden="true" />
            <svg className="ed-curve" viewBox="0 0 120 80" aria-hidden="true">
              <path d="M6 70C30 20 70 10 110 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M98 8l12 10-14 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {s.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ed-hero-photo" src={s.hero_image_url} alt="" />
            ) : (
              <div className="ed-device" aria-hidden="true">
                <div className="ed-screen">
                  <div className="ed-screen-bar">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="ed-screen-video">
                    {featured ? (
                      <Cover src={coverFor(featured, featured.first_video ?? undefined)} title={featured.title} eager />
                    ) : (
                      <div className="cover cover-drawn" />
                    )}
                    <span className="ed-play">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                      </svg>
                    </span>
                  </div>
                  <div className="ed-screen-rows">
                    {(featured?.lesson_titles.slice(0, 3) ?? ["Introduction", "First lesson", "Practice"]).map((t, i) => (
                      <span key={i} className={i === 0 ? "done" : i === 1 ? "now" : ""}>
                        <i />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ed-base" />
              </div>
            )}
            {nextLive ? (
              <div className="ed-float ed-float-card">
                <span className="ed-live-dot" aria-hidden="true" />
                <span>
                  Next live class
                  <small>
                    {nextLive.starts_at.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", weekday: "short", day: "numeric", month: "short" })}{" "}
                    · {dhakaTime(nextLive.starts_at)}
                  </small>
                </span>
              </div>
            ) : (
              <div className="ed-float ed-float-card">
                <b className="num">{num(totalLessons)}</b>
                <span>
                  video lessons
                  <small>with a quiz after each</small>
                </span>
              </div>
            )}
            <div className="ed-float ed-float-pass">
              <span className="ed-pass-dot">
                <Icon name="check" size={14} />
              </span>
              Lesson passed · next one open
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Topics ---------- */}
      {home.topics.length > 0 && (
        <section className="ed-section ed-section-tight">
          <div className="ed-wrap">
            <div className="ed-sec-head">
              <h2 className="ed-h2">
                Explore by{" "}
                <span className="ed-hl">
                  topic
                  <Swoosh />
                </span>
              </h2>
              <Link href="/courses" className="ed-textlink">
                All courses <Icon name="next" size={16} />
              </Link>
            </div>
            <ul className="ed-topics">
              {home.topics.map((t, i) => (
                <li key={t.name}>
                  <Link href={`/courses?topic=${encodeURIComponent(t.name)}`} className="ed-topic">
                    <span className="ed-topic-icon">
                      <Icon name={TOPIC_ICONS[i % TOPIC_ICONS.length]!} size={22} />
                    </span>
                    <b>{t.name}</b>
                    <small>
                      {t.count} {t.count === 1 ? "course" : "courses"}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- Popular courses ---------- */}
      <section className="ed-section" id="courses">
        <div className="ed-wrap">
          <div className="ed-sec-head">
            <h2 className="ed-h2">
              Popular{" "}
              <span className="ed-hl">
                courses
                <Swoosh />
              </span>
            </h2>
            <p className="ed-sec-note">Start with a free preview lesson on any course page.</p>
          </div>
          <CourseGrid courses={courses.map(toCard)} popular />
        </div>
      </section>

      {/* ---------- Live classes ---------- */}
      {home.live.length > 0 && (
        <section className="ed-section ed-section-tint" id="live">
          <div className="ed-wrap">
            <div className="ed-sec-head">
              <h2 className="ed-h2">
                Upcoming{" "}
                <span className="ed-hl">
                  live classes
                  <Swoosh />
                </span>
              </h2>
              <p className="ed-sec-note">Ask your teacher questions in real time. Included with the course.</p>
            </div>
            <ul className="ed-live">
              {home.live.map((l) => (
                <li key={l.id}>
                  <Link href={`/courses/${l.course_slug}`} className="ed-live-card">
                    <span className="ed-live-date">
                      <b>{l.starts_at.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric" })}</b>
                      {l.starts_at.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", month: "short" })}
                    </span>
                    <span className="ed-live-info">
                      <span className="ed-tag">Live</span>
                      <b>{l.title}</b>
                      <small>
                        {l.starts_at.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", weekday: "long" })} ·{" "}
                        {dhakaTime(l.starts_at)} · {l.duration_min} min
                      </small>
                      <small className="ed-live-course">
                        {l.course_title}
                        {l.teacher ? ` · with ${l.teacher}` : ""}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- How learning works ---------- */}
      <section className={`ed-section${home.live.length ? "" : " ed-section-tint"}`} id="how">
        <div className="ed-wrap">
          <div className="ed-sec-head ed-sec-center">
            <h2 className="ed-h2">
              How learning{" "}
              <span className="ed-hl">
                works here
                <Swoosh />
              </span>
            </h2>
            <p className="ed-sec-note">Everything a course needs, in one place.</p>
          </div>
          <ul className="ed-features">
            {[
              ["learn", "Video lessons", "Short, clear lessons you can pause, speed up and rewatch. Your place is saved on every device."],
              ["check", "A quiz after every lesson", "A few questions check what you understood. Pass them and the next lesson opens; retry as often as you like."],
              ["calendar", "Live classes", "Join your teacher live to ask questions. Recordings are added for anyone who missed it."],
              ["book", "Notes and materials", "Download PDFs, diagrams and worksheets for each lesson, to revise from later."],
              ["grid", "Track your progress", "Your dashboard shows what you’ve finished, your quiz scores and what comes next."],
              ["students", "Learn on your phone", "Everything works in your phone’s browser. No app to install."],
            ].map(([icon, t, d]) => (
              <li key={t} data-reveal>
                <span className="ed-feature-icon">
                  <Icon name={icon!} size={22} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Teachers ---------- */}
      {home.teachers.length > 0 && (
        <section className="ed-section">
          <div className="ed-wrap">
            <div className="ed-sec-head">
              <h2 className="ed-h2">
                Meet your{" "}
                <span className="ed-hl">
                  teachers
                  <Swoosh />
                </span>
              </h2>
            </div>
            <ul className="ed-teachers">
              {home.teachers.slice(0, 4).map((t) => (
                <li key={t.name} className="ed-teacher-card">
                  <span className="ed-teacher-av" style={{ ["--h" as string]: hue(t.name) }} aria-hidden="true">
                    {initials(t.name)}
                  </span>
                  <b>{t.name}</b>
                  <ul className="ed-teacher-stats">
                    <li>
                      <span className="num">{t.courses}</span> {t.courses === 1 ? "course" : "courses"}
                    </li>
                    <li>
                      <span className="num">{t.lessons}</span> lessons
                    </li>
                    {t.students > 0 && (
                      <li>
                        <span className="num">{t.students}</span> {t.students === 1 ? "student" : "students"}
                      </li>
                    )}
                  </ul>
                  <Link href={`/courses?q=${encodeURIComponent(t.name)}`} className="ed-textlink">
                    View courses <Icon name="next" size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      <section className="ed-section ed-section-tint" id="faq">
        <div className="ed-wrap ed-faq">
          <div>
            <h2 className="ed-h2">
              Questions{" "}
              <span className="ed-hl">
                & answers
                <Swoosh />
              </span>
            </h2>
            <p className="ed-sec-note">
              Still stuck?{" "}
              {s.support_phone ? (
                <>
                  Call or WhatsApp <a href={`tel:${s.support_phone}`}>{s.support_phone}</a>.
                </>
              ) : s.support_email ? (
                <>
                  Write to <a href={`mailto:${s.support_email}`}>{s.support_email}</a>.
                </>
              ) : (
                <>Sign in and check your dashboard.</>
              )}
            </p>
          </div>
          <div className="ed-faq-list">
            {[
              ["Can I watch before I pay?", "Yes. Lessons marked as free previews play on the course page for everyone, no account needed."],
              [
                "How do the quizzes work?",
                "Each lesson ends with a few questions. Get enough right and the next lesson opens. If you miss, watch again and retry; the right answers appear once you pass.",
              ],
              [
                "How do live classes work?",
                "Your teacher schedules them for the course. When you’re enrolled, a Join button appears on your dashboard 15 minutes before the start. Recordings are added afterwards.",
              ],
              [
                "How do I pay for a course?",
                "Open the course and press Buy. You pay once with bKash and paste the Transaction ID; we confirm it, usually the same day, and the course opens on your dashboard.",
              ],
              ["How long do I keep access?", "For as long as the course is on the site. There is no monthly fee."],
              ["Can I learn on my phone?", "Yes. The site and the video player work in any phone browser, and your progress is saved to your account."],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span className="ed-plus" aria-hidden="true">
                    <Icon name="plus" size={16} />
                  </span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Join band ---------- */}
      <section className="ed-section ed-section-last">
        <div className="ed-wrap">
          <div className="ed-join" data-reveal>
            <Dashes className="ed-dash ed-dash-b" />
            <Dashes className="ed-dash ed-dash-c" />
            <div>
              <p className="ed-kicker">Start learning today</p>
              <h2>
                Create your free account and watch your{" "}
                <span className="ed-hl">
                  first lesson.
                  <Swoosh />
                </span>
              </h2>
            </div>
            <svg className="ed-join-arrow" viewBox="0 0 160 60" aria-hidden="true">
              <path d="M4 52C40 50 90 36 146 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M132 8l15 4-8 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link className="ed-btn ed-btn-solid ed-btn-lg" href={user ? "/dashboard" : "/register"}>
              {user ? "Go to my dashboard" : "Create free account"}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter s={s} />
    </div>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  enrollmentsForUser,
  lessonsPassedByDay,
  lessonsPassedByWeek,
  listPublishedCourses,
  paymentsForUser,
  upcomingLiveForUser,
} from "@/lib/data";
import LiveList from "@/components/live/LiveList";
import { minutes, num, taka } from "@/lib/format";
import { coverFor } from "@/lib/video";
import Icon from "@/components/Icon";
import Cover from "@/components/Cover";
import PillBars from "@/components/dash/PillBars";
import Gauge from "@/components/dash/Gauge";
import StatusPill from "@/components/StatusPill";

export const metadata = { title: "Dashboard" };

const dhaka = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", ...o });

export default async function StudentDashboard({ searchParams }: { searchParams: { sent?: string } }) {
  const user = await requireUser("/dashboard");
  const [mine, payments, days, weeks, catalogue, live] = await Promise.all([
    enrollmentsForUser(user.id),
    paymentsForUser(user.id),
    lessonsPassedByDay(user.id, 7),
    lessonsPassedByWeek(user.id, 6),
    listPublishedCourses(),
    upcomingLiveForUser(user.id, 4),
  ]);
  const first = user.name.split(" ")[0];
  const waiting = payments.filter((p) => p.status === "pending");
  const sent = searchParams.sent ? waiting.find((p) => p.course_slug === searchParams.sent) : undefined;

  const totalLessons = mine.reduce((a, c) => a + c.lesson_count, 0);
  const doneLessons = mine.reduce((a, c) => a + c.done_count, 0);
  const pct = totalLessons ? (doneLessons / totalLessons) * 100 : 0;
  const [pctWhole, pctDec] = pct.toFixed(1).split(".");
  const weekPassed = days.reduce((a, d) => a + d.total, 0);
  const current = mine.find((c) => c.done_count < c.lesson_count) ?? mine[0];
  const nextLesson = current ? current.lesson_titles[Math.min(current.done_count, current.lesson_count - 1)] : undefined;
  const curPct = current && current.lesson_count ? Math.round((current.done_count / current.lesson_count) * 100) : 0;
  const owned = new Set([...mine.map((c) => c.id), ...waiting.map((p) => p.course_id)]);
  const suggestion = catalogue.find((c) => !owned.has(c.id));


  return (
    <div className="bento">
      <div className="greet">
        <h1>
          Welcome back, <span>{first}</span>
        </h1>
        <div className="greet-tools">
          <span className="chip-pill">
            <Icon name="calendar" size={17} />
            {dhaka(new Date(), { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <Link href="/#courses" className="chip-pill chip-action">
            <Icon name="plus" size={17} />
            Browse courses
          </Link>
        </div>
      </div>

      {sent && (
        <p className="banner">
          <b>Payment received.</b> We’re matching TrxID {sent.trx_id} in our bKash statement. {sent.course_title} opens
          here as soon as it’s approved.
        </p>
      )}

      {live.length > 0 && (
        <section className="d-card live-card">
          <header className="d-head">
            <span className="d-icon">
              <Icon name="calendar" size={18} />
            </span>
            <div>
              <h2>Upcoming live classes</h2>
              <p>The Join button opens 15 minutes before each class</p>
            </div>
          </header>
          <LiveList items={live} showCourse empty="" />
        </section>
      )}

      <div className="b-grid b-student">
        {/* Continue learning: the green card */}
        <section className="d-card area-a">
          <header className="d-head">
            <div>
              <h2>{current ? "Continue learning" : "Start learning"}</h2>
              <p>{current ? "Pick up where you stopped" : waiting.length ? "Your course opens after approval" : "Your first course is a click away"}</p>
            </div>
            <Link href={current ? `/learn/${current.slug}` : "/#courses"} className="d-arrow" aria-label="Open">
              <Icon name="arrow" size={18} />
            </Link>
          </header>
          <Link href={current ? `/learn/${current.slug}` : "/#courses"} className="money-card">
            <div className="mc-top">
              <b>{current ? `${current.done_count}/${current.lesson_count} lessons` : waiting.length ? "Being checked" : "No course yet"}</b>
              <Icon name="learn" size={20} />
            </div>
            <span className="mc-label">{current ? "Next lesson" : waiting.length ? waiting[0]!.course_title : "Browse the catalogue"}</span>
            <span className="mc-title">{current ? nextLesson ?? "Course complete" : waiting.length ? `TrxID ${waiting[0]!.trx_id}` : "Find a course"}</span>
            {current && (
              <div className="mc-progress" aria-label={`${curPct}% complete`}>
                <i style={{ width: `${curPct}%` }} />
              </div>
            )}
            <div className="mc-foot">
              <span>{current ? current.title : "Pay once with bKash"}</span>
              {current && <span className="num">{curPct}%</span>}
            </div>
          </Link>
        </section>

        <section className="d-card d-small area-b">
          <p className="d-label">Lessons passed, last 7 days</p>
          <div className="d-row">
            <span className="d-big num">+{weekPassed}</span>
            <span className={`badge${weekPassed ? "" : " badge-grey"}`}>
              {doneLessons} in total
            </span>
          </div>
        </section>

        <div className="area-c">
          <PillBars
            title="Lessons passed"
            icon={<Icon name="check" size={18} />}
            datasets={[
              { key: "d", name: "This week", data: days.map((d) => ({ label: d.label, total: d.total })) },
              { key: "w", name: "6 weeks", data: weeks.map((d) => ({ label: d.label, total: d.total })) },
            ]}
          />
        </div>

        <section className="d-card area-d d-total">
          <header className="d-head">
            <div>
              <h2>Overall progress</h2>
              <p>Across all your courses</p>
            </div>
          </header>
          <div className="gauge-wrap">
            <Gauge value={pct} />
            <div className="gauge-text">
              <p className="d-balance num">
                {pctWhole}
                <span>.{pctDec}%</span>
              </p>
              <p className="d-center-label">
                {doneLessons} of {totalLessons} lessons passed
              </p>
            </div>
          </div>
          <div className="area-wrap area-wrap-plain">
            <div className="split-btns">
              <Link href={current ? `/learn/${current.slug}` : "/#courses"} className="sb sb-on">
                Resume <Icon name="next" size={15} />
              </Link>
              <Link href="/#courses" className="sb">
                Browse <Icon name="search" size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* My courses */}
        <section className="d-card area-e">
          <header className="d-head">
            <div>
              <h2>My courses</h2>
              <p>
                {mine.length} {mine.length === 1 ? "course" : "courses"} open
                {waiting.length ? ` · ${waiting.length} being checked` : ""}
              </p>
            </div>
            <Link href="/#courses" className="d-arrow" aria-label="Browse courses">
              <Icon name="arrow" size={18} />
            </Link>
          </header>
          {mine.length === 0 ? (
            <p className="empty">
              {waiting.length
                ? "Your course opens here once the payment is approved, usually the same day."
                : "Pick a course, send the price by bKash and paste the Transaction ID. It opens here once approved."}
            </p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl d-tbl stackable">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Progress</th>
                    <th>Length</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {mine.map((c) => {
                    const p = c.lesson_count ? Math.round((c.done_count / c.lesson_count) * 100) : 0;
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="who">
                            <span className="thumb">
                              <Cover src={coverFor(c, c.first_video ?? undefined)} title={c.title} />
                            </span>
                            <div>
                              <b>{c.title}</b>
                              <small className="who-sub">
                                {c.done_count}/{c.lesson_count} lessons
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="secondary">
                          <span className="mini-bar" aria-hidden="true">
                            <i style={{ width: `${p}%` }} />
                          </span>
                          <span className="num">{p}%</span>
                        </td>
                        <td className="secondary">{minutes(c.total_min)}</td>
                        <td className="secondary">
                          <span className={`status ${p === 100 ? "s-approved" : p ? "s-pending" : "s-idle"}`}>
                            {p === 100 ? "Complete" : p ? "In progress" : "Not started"}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="row-actions">
                            <Link className="btn btn-sm" href={`/learn/${c.slug}`}>
                              {p === 100 ? "Review" : p ? "Continue" : "Start"}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Payments */}
        <section className="d-card area-f">
          <header className="d-head">
            <span className="d-icon">
              <Icon name="card" size={18} />
            </span>
            <div>
              <h2>Payments</h2>
              <p>Your bKash payments</p>
            </div>
          </header>
          <div className="d-row d-row-big">
            <span className="d-balance num">
              ৳{num(payments.filter((p) => p.status === "approved").reduce((a, p) => a + p.amount, 0))}
            </span>
            <span className={`badge${waiting.length ? " badge-wait" : " badge-grey"}`}>
              {waiting.length ? `${waiting.length} waiting` : "all checked"}
            </span>
          </div>
          <div className="sub-card">
            <header className="d-head">
              <div>
                <h3>{payments.length ? "Latest" : suggestion ? "Suggested for you" : "Nothing yet"}</h3>
                <p>
                  {payments.length
                    ? payments[0]!.course_title
                    : suggestion
                      ? `${suggestion.title} · ${taka(suggestion.price)}`
                      : "Courses appear here when published"}
                </p>
              </div>
              <Link
                href={payments.length ? "/dashboard/payments" : suggestion ? `/courses/${suggestion.slug}` : "/"}
                className="d-arrow d-arrow-sm"
                aria-label="Open"
              >
                <Icon name="arrow" size={16} />
              </Link>
            </header>
            {payments[0] && <StatusPill status={payments[0].status} />}
          </div>
        </section>
      </div>
    </div>
  );
}

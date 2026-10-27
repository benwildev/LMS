import Link from "next/link";
import { notFound } from "next/navigation";
import { courseExtrasCount, getCourseById, listLiveForCourse } from "@/lib/data";
import { dhakaDateTime, dhakaTime, liveState, toDhakaInput } from "@/lib/time";
import CourseTabs from "@/components/admin/CourseTabs";
import LiveForm from "@/components/admin/LiveForm";
import Submit from "@/components/Submit";
import { deleteLiveClass, saveLiveClass } from "@/app/actions/admin";

export const metadata = { title: "Live classes" };

const LABEL = { upcoming: ["", "Scheduled"], soon: ["wait", "Starting soon"], live: ["good", "Live now"], ended: ["", "Ended"] } as const;

export default async function CourseLive({ params }: { params: { id: string } }) {
  const course = await getCourseById(Number(params.id));
  if (!course) notFound();
  const [items, counts] = await Promise.all([listLiveForCourse(course.id), courseExtrasCount(course.id)]);
  const now = Date.now();
  const upcoming = items.filter((l) => liveState(l.starts_at, l.duration_min, now) !== "ended");
  const past = items.filter((l) => liveState(l.starts_at, l.duration_min, now) === "ended").reverse();

  const row = (l: (typeof items)[number]) => {
    const st = liveState(l.starts_at, l.duration_min, now);
    const end = new Date(l.starts_at.getTime() + l.duration_min * 60_000);
    return (
      <details className="q-card" key={l.id}>
        <summary>
          <span>
            <b>{l.title}</b>
            <span className="q-ans">
              {dhakaDateTime(l.starts_at)} – {dhakaTime(end)} · {l.duration_min} min
              {st === "ended" && (l.recording_url ? " · recording added" : " · no recording yet")}
            </span>
          </span>
          <span className={`pill ${LABEL[st][0]}`}>{LABEL[st][1]}</span>
        </summary>
        <div className="q-body">
          <p className="sub" style={{ marginBottom: 12 }}>
            <a className="textbtn" href={l.meet_url} target="_blank" rel="noopener noreferrer">
              {l.meet_url}
            </a>
          </p>
          <LiveForm
            action={saveLiveClass.bind(null, course.id)}
            initial={{
              id: l.id,
              title: l.title,
              description: l.description,
              starts_at: toDhakaInput(l.starts_at),
              duration_min: l.duration_min,
              meet_url: l.meet_url,
              recording_url: l.recording_url,
            }}
          />
          <form action={deleteLiveClass.bind(null, l.id)} style={{ marginTop: 12 }}>
            <Submit className="textbtn danger" pending="Removing…">
              Cancel and remove this class
            </Submit>
          </form>
        </div>
      </details>
    );
  };

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{course.title}</h1>
          <p>
            Live classes for the {course.student_count} {course.student_count === 1 ? "student" : "students"} in this course
          </p>
        </div>
        <div className="actions">
          <Link className="btn btn-ghost" href="/admin/live">
            All live classes
          </Link>
        </div>
      </div>
      <CourseTabs id={course.id} on="live" live={counts.live} materials={counts.materials} />

      <div className="builder" style={{ marginTop: 20 }}>
        <div className="stack">
          <section className="panel-card">
            <header>
              <h2>Coming up</h2>
              <span>{upcoming.length}</span>
            </header>
            <div className="panel-body">
              {upcoming.length ? <div className="q-list">{upcoming.map(row)}</div> : <p className="empty">No classes scheduled.</p>}
            </div>
          </section>
          {past.length > 0 && (
            <section className="panel-card">
              <header>
                <h2>Past classes</h2>
                <span>Add the recording so students who missed it can watch</span>
              </header>
              <div className="panel-body">
                <div className="q-list">{past.map(row)}</div>
              </div>
            </section>
          )}
        </div>
        <section className="panel-card">
          <header>
            <h2>Schedule a live class</h2>
          </header>
          <div className="panel-body">
            <LiveForm action={saveLiveClass.bind(null, course.id)} />
          </div>
        </section>
      </div>
    </>
  );
}

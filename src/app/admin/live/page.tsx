import Link from "next/link";
import { listAllCourses, listAllLive } from "@/lib/data";
import { dhakaDateTime, liveState, until } from "@/lib/time";

export const metadata = { title: "Live classes" };

export default async function AllLive() {
  const [items, courses] = await Promise.all([listAllLive(), listAllCourses()]);
  const now = Date.now();
  const upcoming = items.filter((l) => liveState(l.starts_at, l.duration_min, now) !== "ended").reverse();
  const past = items.filter((l) => liveState(l.starts_at, l.duration_min, now) === "ended");
  const table = (rows: typeof items, isPast: boolean) => (
    <table className="tbl stackable">
      <thead>
        <tr>
          <th>Class</th>
          <th>Course</th>
          <th>When (Dhaka)</th>
          <th>{isPast ? "Recording" : "Starts"}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((l) => {
          const st = liveState(l.starts_at, l.duration_min, now);
          return (
            <tr key={l.id}>
              <td>
                <b style={{ fontWeight: 600 }}>{l.title}</b>
                <small>{l.duration_min} min</small>
              </td>
              <td className="secondary">{l.course_title}</td>
              <td className="secondary">{dhakaDateTime(l.starts_at)}</td>
              <td className="secondary">
                {isPast ? (
                  <span className={`pill ${l.recording_url ? "good" : "wait"}`}>{l.recording_url ? "Added" : "Missing"}</span>
                ) : st === "live" ? (
                  <span className="pill good">Live now</span>
                ) : (
                  until(l.starts_at, now)
                )}
              </td>
              <td className="actions-cell">
                <div className="row-actions">
                  {!isPast && (
                    <a className="btn btn-sm" href={l.meet_url} target="_blank" rel="noopener noreferrer">
                      Open meeting
                    </a>
                  )}
                  <Link className="btn btn-ghost btn-sm" href={`/admin/courses/${l.course_id}/live`}>
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Live classes</h1>
          <p>
            {upcoming.length} coming up · {past.length} past. Schedule a class from a course’s Live classes tab.
          </p>
        </div>
      </div>
      {courses.length > 0 && (
        <div className="chip-row">
          {courses.map((c) => (
            <Link key={c.id} href={`/admin/courses/${c.id}/live`} className="chip-link">
              + {c.title}
            </Link>
          ))}
        </div>
      )}
      <section className="panel-card" style={{ marginTop: 16 }}>
        <header>
          <h2>Coming up</h2>
        </header>
        <div className="panel-body">{upcoming.length ? table(upcoming, false) : <p className="empty">Nothing scheduled.</p>}</div>
      </section>
      {past.length > 0 && (
        <section className="panel-card" style={{ marginTop: 16 }}>
          <header>
            <h2>Past</h2>
          </header>
          <div className="panel-body">{table(past, true)}</div>
        </section>
      )}
    </>
  );
}

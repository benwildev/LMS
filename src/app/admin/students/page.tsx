import { enrollmentsForStudents, listAllCourses, listStudents } from "@/lib/data";
import { num, when } from "@/lib/format";
import { Avatar } from "@/components/AppShell";
import Submit from "@/components/Submit";
import { grantAccess, revokeAccess } from "@/app/actions/admin";

export const metadata = { title: "Students" };

export default async function Students({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim().toLowerCase();
  const all = await listStudents();
  const rows = q
    ? all.filter((u) => [u.name, u.email, u.phone].some((v) => v.toLowerCase().includes(q)))
    : all;
  const courses = await listAllCourses();
  const enrolMap = await enrollmentsForStudents(rows.map((u) => u.id));

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Students</h1>
          <p>
            {num(all.length)} {all.length === 1 ? "account" : "accounts"} ·{" "}
            {num(all.filter((u) => u.course_count > 0).length)} with at least one course
          </p>
        </div>
      </div>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <form>
          <input className="input" type="search" name="q" defaultValue={searchParams.q} placeholder="Search name, email or phone" />
        </form>
        <span className="count-note">{rows.length} shown</span>
      </div>
      {rows.length === 0 ? (
        <p className="empty">{q ? `No one matches “${searchParams.q}”.` : "No accounts yet."}</p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl stackable">
            <thead>
              <tr>
                <th>Person</th>
                <th>Courses and progress</th>
                <th className="num">Paid</th>
                <th className="num">Joined</th>
                <th>Give access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const enr = enrolMap.get(u.id) ?? [];
                const options = courses.filter((c) => !enr.some((e) => e.id === c.id));
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="who">
                        <Avatar name={u.name} id={u.id} />
                        <div>
                          <b>{u.name}</b>
                          {u.role === "admin" && <span className="pill" style={{ marginLeft: 8 }}>Admin</span>}
                          <small>
                            {u.email}
                            {u.phone ? ` · ${u.phone}` : ""}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="secondary">
                      {enr.length === 0 ? (
                        <span className="sub">—</span>
                      ) : (
                        enr.map((e) => (
                          <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                            <span>
                              {e.title} <span className="sub" style={{ display: "inline" }}>{e.done_count}/{e.lesson_count}</span>
                            </span>
                            <form action={revokeAccess.bind(null, u.id, e.id)}>
                              <Submit className="textbtn danger" pending="…" style={{ fontSize: 12 }}>
                                Remove
                              </Submit>
                            </form>
                          </div>
                        ))
                      )}
                    </td>
                    <td className="num">{u.paid ? `৳${num(u.paid)}` : <span className="sub">—</span>}</td>
                    <td className="num secondary">{when(u.created_at)}</td>
                    <td className="actions-cell">
                      {options.length > 0 && (
                        <form action={grantAccess.bind(null, u.id)} className="row-actions" style={{ justifyContent: "flex-start" }}>
                          <select name="courseId" aria-label="Course" style={{ minHeight: 30, width: 180, fontSize: 13 }}>
                            {options.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                          <Submit className="btn btn-ghost btn-sm" pending="…">
                            Give
                          </Submit>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

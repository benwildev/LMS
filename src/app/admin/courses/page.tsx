import Link from "next/link";
import { listAllCourses } from "@/lib/data";
import { minutes, num, taka } from "@/lib/format";
import { coverFor } from "@/lib/video";
import Cover from "@/components/Cover";

export const metadata = { title: "Courses" };

export default async function Courses() {
  const courses = await listAllCourses();
  const live = courses.filter((c) => c.published).length;
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Courses</h1>
          <p>
            {courses.length} {courses.length === 1 ? "course" : "courses"} · {live} on the landing page
          </p>
        </div>
        <div className="actions">
          <Link className="btn" href="/admin/courses/new">
            New course
          </Link>
        </div>
      </div>
      {courses.length === 0 ? (
        <p className="empty">
          No courses yet. <Link className="textbtn" href="/admin/courses/new">Create the first one</Link>, add lessons
          with their video links, then publish it.
        </p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl stackable">
            <thead>
              <tr>
                <th>Course</th>
                <th className="num">Lessons</th>
                <th className="num">Video</th>
                <th className="num">Price</th>
                <th className="num">Students</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="who">
                      <div className="thumb">
                        <Cover src={coverFor(c, c.first_video ?? undefined)} title={c.title} />
                      </div>
                      <div>
                        <Link className="name" href={`/admin/courses/${c.id}`}>
                          <b>{c.title}</b>
                        </Link>
                        <small>/courses/{c.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td className="num secondary">{c.lesson_count}</td>
                  <td className="num secondary">{minutes(c.total_min)}</td>
                  <td className="num">{taka(c.price)}</td>
                  <td className="num secondary">{num(c.student_count)}</td>
                  <td className="secondary">
                    <span className={`pill ${c.published ? "good" : ""}`}>{c.published ? "Published" : "Draft"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

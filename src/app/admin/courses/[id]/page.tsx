import Link from "next/link";
import { notFound } from "next/navigation";
import { courseExtrasCount, getCourseById, listLessons } from "@/lib/data";
import CourseTabs from "@/components/admin/CourseTabs";
import { minutes, num, taka } from "@/lib/format";
import { parseVideo } from "@/lib/video";
import CourseForm from "@/components/admin/CourseForm";
import LessonForm from "@/components/admin/LessonForm";
import Submit from "@/components/Submit";
import Icon from "@/components/Icon";
import { addLesson, deleteCourse, moveLesson, togglePublish, updateCourse } from "@/app/actions/admin";

export const metadata = { title: "Edit course" };

export default async function EditCourse({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const course = await getCourseById(Number(params.id));
  if (!course) notFound();
  const [lessons, counts] = await Promise.all([listLessons(course.id), courseExtrasCount(course.id)]);
  const qTotal = lessons.reduce((a, l) => a + l.question_count, 0);
  const noQuiz = lessons.filter((l) => l.question_count === 0).length;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{course.title}</h1>
          <p>
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"} · {minutes(course.total_min)} ·{" "}
            {qTotal} questions · {taka(course.price)} · {num(course.student_count)}{" "}
            {course.student_count === 1 ? "student" : "students"}
            {noQuiz > 0 && lessons.length > 0 ? ` · ${noQuiz} without questions` : ""}
          </p>
        </div>
        <div className="actions">
          <Link className="btn btn-ghost" href={`/courses/${course.slug}`} target="_blank">
            View page
          </Link>
          <form action={togglePublish.bind(null, course.id)}>
            <Submit className={course.published ? "btn btn-ghost" : "btn"} pending="…">
              {course.published ? "Unpublish" : "Publish"}
            </Submit>
          </form>
        </div>
      </div>
      <CourseTabs id={course.id} on="edit" live={counts.live} materials={counts.materials} />
      <div style={{ height: 20 }} />
      {searchParams.error === "nolessons" && (
        <p className="empty" style={{ marginBottom: 16 }}>
          Add at least one lesson before publishing.
        </p>
      )}

      <div className="builder">
        <div className="stack">
          <section className="panel-card lesson-list">
            <header>
              <h2>Lessons</h2>
              <span>Students open them in this order</span>
            </header>
            <div className="panel-body">
              {lessons.length === 0 ? (
                <p className="empty">No lessons yet. Add the first one below.</p>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Lesson</th>
                      <th className="num">Questions</th>
                      <th className="num">Length</th>
                      <th className="num">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((l, i) => (
                      <tr key={l.id}>
                        <td>
                          <Link className="name" href={`/admin/courses/${course.id}/lessons/${l.id}`}>
                            <b>
                              {i + 1}. {l.title}
                            </b>
                          </Link>
                          <small>
                            {parseVideo(l.video_url)?.kind === "drive" ? "Google Drive" : "YouTube"}
                            {l.is_preview ? " · free preview" : ""}
                          </small>
                        </td>
                        <td className="num">
                          {l.question_count ? l.question_count : <span className="flag">None</span>}
                        </td>
                        <td className="num">{l.duration_min ? `${l.duration_min} m` : <span className="sub">—</span>}</td>
                        <td className="num">
                          <span className="order">
                            <form action={moveLesson.bind(null, l.id, -1)}>
                              <button className="icon-btn" disabled={i === 0} aria-label={`Move ${l.title} up`}>
                                <Icon name="up" />
                              </button>
                            </form>
                            <form action={moveLesson.bind(null, l.id, 1)}>
                              <button
                                className="icon-btn"
                                disabled={i === lessons.length - 1}
                                aria-label={`Move ${l.title} down`}
                              >
                                <Icon name="down" />
                              </button>
                            </form>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          <section className="panel-card">
            <header>
              <h2>Add a lesson</h2>
            </header>
            <div className="panel-body">
              <LessonForm action={addLesson.bind(null, course.id)} submitLabel="Add lesson" compact />
            </div>
          </section>
        </div>

        <section className="panel-card">
          <header>
            <h2>Course details</h2>
          </header>
          <div className="panel-body">
            <CourseForm
              action={updateCourse.bind(null, course.id)}
              initial={course}
              submitLabel="Save details"
              canPublish={lessons.length > 0}
            />
            <div className="danger-zone">
              <p>Deleting removes its lessons, questions, payments and student progress.</p>
              <form action={deleteCourse.bind(null, course.id)}>
                <Submit className="btn btn-danger btn-sm" pending="Deleting…">
                  Delete course
                </Submit>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

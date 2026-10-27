import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById, getLesson, listLessons, listQuestions } from "@/lib/data";
import LessonForm from "@/components/admin/LessonForm";
import QuestionForm from "@/components/admin/QuestionForm";
import Submit from "@/components/Submit";
import { deleteLesson, deleteQuestion, saveQuestion, updateLesson } from "@/app/actions/admin";

export const metadata = { title: "Edit lesson" };

export default async function EditLesson({ params }: { params: { id: string; lessonId: string } }) {
  const lesson = await getLesson(Number(params.lessonId));
  const course = await getCourseById(Number(params.id));
  if (!lesson || !course || lesson.course_id !== course.id) notFound();
  const questions = await listQuestions(lesson.id);
  const all = await listLessons(course.id);
  const idx = all.findIndex((l) => l.id === lesson.id);
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const needed = Math.ceil((questions.length * lesson.pass_percent) / 100);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{lesson.title}</h1>
          <p>
            <Link className="textbtn" href={`/admin/courses/${course.id}`}>
              {course.title}
            </Link>{" "}
            · lesson {idx + 1} of {all.length} ·{" "}
            {questions.length
              ? `${needed} of ${questions.length} right to pass`
              : "no questions: the student marks it done"}
          </p>
        </div>
        <div className="actions">
          {prev && (
            <Link className="btn btn-ghost" href={`/admin/courses/${course.id}/lessons/${prev.id}`}>
              Previous
            </Link>
          )}
          {next ? (
            <Link className="btn btn-ghost" href={`/admin/courses/${course.id}/lessons/${next.id}`}>
              Next lesson
            </Link>
          ) : (
            <Link className="btn btn-ghost" href={`/admin/courses/${course.id}`}>
              Back to course
            </Link>
          )}
        </div>
      </div>

      <div className="builder">
        <section className="panel-card">
          <header>
            <h2>Video and settings</h2>
          </header>
          <div className="panel-body">
            <LessonForm action={updateLesson.bind(null, lesson.id)} initial={lesson} submitLabel="Save lesson" />
            <div className="danger-zone">
              <p>Deleting this lesson also removes its questions and students’ results.</p>
              <form action={deleteLesson.bind(null, lesson.id)}>
                <Submit className="btn btn-danger btn-sm" pending="Deleting…">
                  Delete lesson
                </Submit>
              </form>
            </div>
          </div>
        </section>

        <div className="stack">
          <section className="panel-card">
            <header>
              <h2>Questions</h2>
              <span>
                {questions.length} · pass mark {lesson.pass_percent}%
              </span>
            </header>
            <div className="panel-body">
              {questions.length === 0 ? (
                <p className="empty">
                  No questions yet. Add two or three that check the main idea of the video.
                </p>
              ) : (
                <div className="q-list">
                  {questions.map((q, i) => (
                    <details className="q-card" key={q.id}>
                      <summary>
                        <span>
                          <b>
                            {i + 1}. {q.prompt}
                          </b>
                          <span className="q-ans">
                            {q.options.length} answers · correct: <em>{q.options[q.correct_index]}</em>
                          </span>
                        </span>
                        <span className="sub">Edit</span>
                      </summary>
                      <div className="q-body">
                        <QuestionForm action={saveQuestion.bind(null, lesson.id)} initial={q} />
                        <form action={deleteQuestion.bind(null, q.id)} style={{ marginTop: 12 }}>
                          <Submit className="textbtn danger" pending="Removing…">
                            Remove question
                          </Submit>
                        </form>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </section>
          <section className="panel-card">
            <header>
              <h2>Add a question</h2>
            </header>
            <div className="panel-body">
              <QuestionForm action={saveQuestion.bind(null, lesson.id)} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

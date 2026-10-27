import { notFound } from "next/navigation";
import { courseExtrasCount, getCourseById, listLessons, listMaterials } from "@/lib/data";
import { fileSize } from "@/lib/time";
import { MAX_UPLOAD_MB } from "@/lib/storage";
import CourseTabs from "@/components/admin/CourseTabs";
import MaterialForm from "@/components/admin/MaterialForm";
import { materialKind } from "@/components/live/MaterialList";
import Submit from "@/components/Submit";
import { addMaterial, deleteMaterial } from "@/app/actions/admin";
import { when } from "@/lib/format";

export const metadata = { title: "Materials" };

export default async function CourseMaterials({ params }: { params: { id: string } }) {
  const course = await getCourseById(Number(params.id));
  if (!course) notFound();
  const [items, lessons, counts] = await Promise.all([
    listMaterials(course.id),
    listLessons(course.id),
    courseExtrasCount(course.id),
  ]);
  const total = items.reduce((a, m) => a + m.size, 0);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{course.title}</h1>
          <p>
            Extra files and links for enrolled students · {items.length} {items.length === 1 ? "item" : "items"}
            {total ? ` · ${fileSize(total)} stored` : ""}
          </p>
        </div>
      </div>
      <CourseTabs id={course.id} on="materials" live={counts.live} materials={counts.materials} />

      <div className="builder" style={{ marginTop: 20 }}>
        <section className="panel-card">
          <header>
            <h2>Materials</h2>
            <span>Only enrolled students can open them</span>
          </header>
          <div className="panel-body">
            {items.length === 0 ? (
              <p className="empty">Nothing yet. Upload worksheets, slides, notes or images.</p>
            ) : (
              <table className="tbl stackable">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Belongs to</th>
                    <th className="num">Size</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="who">
                          <span className={`mat-icon mat-${materialKind(m).toLowerCase()}`} aria-hidden="true">
                            {m.kind === "link" ? "↗" : materialKind(m).slice(0, 3).toUpperCase()}
                          </span>
                          <div>
                            <a className="name" href={`/api/materials/${m.id}`} target="_blank" rel="noopener">
                              <b>{m.title}</b>
                            </a>
                            <small>
                              {m.kind === "link" ? m.url.replace(/^https:\/\//, "").slice(0, 40) : m.file_name} · {when(m.created_at)}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="secondary">{m.lesson_title ?? "Whole course"}</td>
                      <td className="num secondary">{m.size ? fileSize(m.size) : "—"}</td>
                      <td className="actions-cell">
                        <form action={deleteMaterial.bind(null, m.id)} className="row-actions">
                          <Submit className="textbtn danger" pending="…">
                            Delete
                          </Submit>
                        </form>
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
            <h2>Add material</h2>
          </header>
          <div className="panel-body">
            <MaterialForm
              action={addMaterial.bind(null, course.id)}
              lessons={lessons.map((l) => ({ id: l.id, title: l.title }))}
              maxMb={MAX_UPLOAD_MB}
            />
          </div>
        </section>
      </div>
    </>
  );
}

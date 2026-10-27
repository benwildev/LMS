import Link from "next/link";
import CourseForm from "@/components/admin/CourseForm";
import { createCourse } from "@/app/actions/admin";

export const metadata = { title: "New course" };

export default function NewCourse() {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>New course</h1>
          <p>Start with the basics. You’ll add lessons and their questions on the next screen.</p>
        </div>
        <div className="actions">
          <Link className="btn btn-ghost" href="/admin/courses">
            Cancel
          </Link>
        </div>
      </div>
      <div style={{ maxWidth: 760 }}>
        <CourseForm action={createCourse} submitLabel="Create course" canPublish={false} />
      </div>
    </>
  );
}

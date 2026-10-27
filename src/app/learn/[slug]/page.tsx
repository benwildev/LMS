import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseBySlug, isEnrolled, listLessons, progressForCourse } from "@/lib/data";

export default async function LearnIndex({ params }: { params: { slug: string } }) {
  const user = await requireUser(`/learn/${params.slug}`);
  const course = await getCourseBySlug(params.slug);
  if (!course) notFound();
  if (user.role !== "admin" && !await isEnrolled(user.id, course.id)) redirect(`/courses/${course.slug}`);
  const lessons = await listLessons(course.id);
  if (!lessons.length) redirect(`/courses/${course.slug}`);
  const progress = await progressForCourse(user.id, course.id);
  const next = lessons.find((l) => !progress.get(l.id)?.completed_at) ?? lessons[lessons.length - 1]!;
  redirect(`/learn/${course.slug}/${next.id}`);
}

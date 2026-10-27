import type { CourseWithStats } from "./data";
import type { CardCourse } from "@/components/CourseGrid";
import { coverFor } from "./video";

export function toCard(c: CourseWithStats): CardCourse {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    level: c.level,
    language: c.language,
    category: c.category,
    instructor: c.instructor,
    price: c.price,
    comparePrice: c.compare_price,
    cover: coverFor(c, c.first_video ?? undefined),
    lessons: c.lesson_count,
    minutes: c.total_min,
    questions: c.question_count,
    students: c.student_count,
  };
}

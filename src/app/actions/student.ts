"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createPayment,
  enroll,
  getCourseById,
  getLesson,
  isEnrolled,
  listLessons,
  listQuestions,
  pendingPaymentFor,
  progressForCourse,
  recordAttempt,
  trxExists,
} from "@/lib/data";
import type { FormState } from "./auth";

export async function submitPayment(_: FormState, form: FormData): Promise<FormState> {
  const courseId = Number(form.get("courseId"));
  const course = await getCourseById(courseId);
  if (!course || !course.published) return { error: "This course isn’t available." };
  const user = await requireUser(`/checkout/${course.slug}`);
  if (await isEnrolled(user.id, course.id)) redirect(`/learn/${course.slug}`);

  const sender = String(form.get("sender") || "").replace(/[^\d]/g, "");
  const trx = String(form.get("trx") || "").trim().toUpperCase().replace(/\s+/g, "");
  const fields = { sender, trx };
  if (!/^01[3-9]\d{8}$/.test(sender))
    return { error: "Write the bKash number you sent from: 11 digits, starting with 01.", fields };
  if (!/^[A-Z0-9]{8,14}$/.test(trx))
    return { error: "The Transaction ID is the 10-character code in your bKash SMS, e.g. 9JK4R2X7PQ.", fields };
  if (await pendingPaymentFor(user.id, course.id))
    return { error: "You already sent a payment for this course. We’re checking it now.", fields };
  if (await trxExists(trx)) return { error: "This Transaction ID has already been used.", fields };

  await createPayment({ user_id: user.id, course_id: course.id, amount: course.price, sender_number: sender, trx_id: trx });
  revalidatePath("/admin");
  redirect(`/dashboard?sent=${course.slug}`);
}

export async function enrollFree(courseId: number) {
  const course = await getCourseById(courseId);
  if (!course || !course.published || course.price !== 0) redirect("/");
  const user = await requireUser(`/courses/${course.slug}`);
  await enroll(user.id, course.id);
  redirect(`/learn/${course.slug}`);
}

export type QuizResult = {
  score: number;
  passed: boolean;
  passPercent: number;
  results: { correct: boolean; correctIndex: number | null; explanation: string }[];
  error?: string;
};

export async function submitQuiz(lessonId: number, answers: number[]): Promise<QuizResult> {
  const user = await requireUser();
  const lesson = await getLesson(lessonId);
  const fail = (error: string): QuizResult => ({ score: 0, passed: false, passPercent: 0, results: [], error });
  if (!lesson) return fail("Lesson not found.");
  const course = await getCourseById(lesson.course_id);
  if (!course) return fail("Course not found.");
  if (user.role !== "admin" && !await isEnrolled(user.id, course.id)) return fail("You don’t have access to this course yet.");

  // A lesson only opens once the one before it is passed.
  const lessons = await listLessons(course.id);
  const progress = await progressForCourse(user.id, course.id);
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  if (user.role !== "admin" && idx > 0 && !progress.get(lessons[idx - 1]!.id)?.completed_at)
    return fail("Finish the previous lesson first.");

  const questions = await listQuestions(lesson.id);
  const total = questions.length;
  const correct = questions.filter((q, i) => answers[i] === q.correct_index).length;
  const score = total ? Math.round((correct / total) * 100) : 100;
  const passed = score >= lesson.pass_percent;
  await recordAttempt(user.id, lesson.id, score, passed);
  revalidatePath(`/learn/${course.slug}`, "layout");
  revalidatePath("/dashboard");

  return {
    score,
    passed,
    passPercent: lesson.pass_percent,
    results: questions.map((q, i) => ({
      correct: answers[i] === q.correct_index,
      // The right answer is only shown once the lesson is passed.
      correctIndex: passed ? q.correct_index : null,
      explanation: passed ? q.explanation : "",
    })),
  };
}

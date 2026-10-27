import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { enrollmentsForUser } from "@/lib/data";

/** "Learning" opens the course the student is in the middle of. */
export default async function LearnHome() {
  const user = await requireUser("/learn");
  const mine = await enrollmentsForUser(user.id);
  const current = mine.find((c) => c.done_count < c.lesson_count) ?? mine[0];
  redirect(current ? `/learn/${current.slug}` : "/dashboard");
}

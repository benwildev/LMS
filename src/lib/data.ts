import "server-only";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/* ---------- shapes the pages use ---------- */
export type Role = "admin" | "student";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type User = { id: number; name: string; email: string; phone: string; role: Role; created_at: Date };
export type Course = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  thumbnail_url: string;
  preview_url: string;
  level: string;
  language: string;
  category: string;
  instructor: string;
  compare_price: number;
  published: boolean;
  created_at: Date;
  updated_at: Date;
};
export type CourseInput = Omit<Course, "id" | "created_at" | "updated_at">;
export type CourseWithStats = Course & {
  lesson_count: number;
  total_min: number;
  first_video: string | null;
  student_count: number;
  question_count: number;
  lesson_titles: string[];
};
export type Lesson = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  video_url: string;
  duration_min: number;
  position: number;
  is_preview: boolean;
  pass_percent: number;
};
export type LessonInput = Omit<Lesson, "id" | "position" | "course_id">;
export type LessonWithCount = Lesson & { question_count: number };
export type Question = {
  id: number;
  lesson_id: number;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  position: number;
};
export type PaymentRow = {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  sender_number: string;
  trx_id: string;
  status: PaymentStatus;
  admin_note: string;
  created_at: Date;
  reviewed_at: Date | null;
  user_name: string;
  user_email: string;
  user_phone: string;
  course_title: string;
  course_slug: string;
  course_price: number;
};

export const DEFAULT_SETTINGS = {
  site_name: "The Biology Universe",
  tagline: "Biology video courses with quizzes, notes and live classes.",
  bkash_number: "01700000000",
  bkash_type: "Personal",
  payment_note:
    "Use Send Money from your bKash app to the number above, for the exact course price. Then paste the Transaction ID (TrxID) from the confirmation SMS.",
  support_email: "",
  support_phone: "",
  announcement: "",
  hero_image_url: "",
  hero_title: "Understand biology, don’t just memorise it.",
  hero_subtitle:
    "Clear video lessons, a short quiz after each one, live classes with your teacher, and notes you can keep. Learn at your pace, on your phone or laptop.",
};
export type Settings = typeof DEFAULT_SETTINGS & Record<string, string>;

/* ---------- mappers ---------- */
type DbUser = Prisma.UserGetPayload<{}>;
type DbCourse = Prisma.CourseGetPayload<{}>;
type DbLesson = Prisma.LessonGetPayload<{}>;
type DbQuestion = Prisma.QuestionGetPayload<{}>;

const toUser = (u: DbUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  created_at: u.createdAt,
});
const toCourse = (c: DbCourse): Course => ({
  id: c.id,
  slug: c.slug,
  title: c.title,
  subtitle: c.subtitle,
  description: c.description,
  price: c.price,
  thumbnail_url: c.thumbnailUrl,
  preview_url: c.previewUrl,
  level: c.level,
  language: c.language,
  category: c.category,
  instructor: c.instructor,
  compare_price: c.comparePrice,
  published: c.published,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});
const fromCourse = (c: CourseInput) => ({
  slug: c.slug,
  title: c.title,
  subtitle: c.subtitle,
  description: c.description,
  price: c.price,
  thumbnailUrl: c.thumbnail_url,
  previewUrl: c.preview_url,
  level: c.level,
  language: c.language,
  category: c.category,
  instructor: c.instructor,
  comparePrice: c.compare_price,
  published: c.published,
});
const toLesson = (l: DbLesson): Lesson => ({
  id: l.id,
  course_id: l.courseId,
  title: l.title,
  description: l.description,
  video_url: l.videoUrl,
  duration_min: l.durationMin,
  position: l.position,
  is_preview: l.isPreview,
  pass_percent: l.passPercent,
});
const fromLesson = (l: LessonInput) => ({
  title: l.title,
  description: l.description,
  videoUrl: l.video_url,
  durationMin: l.duration_min,
  isPreview: l.is_preview,
  passPercent: l.pass_percent,
});
const toQuestion = (q: DbQuestion): Question => ({
  id: q.id,
  lesson_id: q.lessonId,
  prompt: q.prompt,
  options: q.options,
  correct_index: q.correctIndex,
  explanation: q.explanation,
  position: q.position,
});

/* ---------- first run ---------- */
let booted: Promise<void> | null = null;
/** Creates the default settings and the first admin (from ADMIN_EMAIL / ADMIN_PASSWORD) if missing. */
export function ensureBootstrap() {
  booted ??= (async () => {
    // One plain statement, no transaction: cheap on every cold start, safe to repeat.
    const keys = Object.keys(DEFAULT_SETTINGS);
    const values = Object.values(DEFAULT_SETTINGS);
    await prisma.$executeRaw`
      INSERT INTO "settings" ("key", "value")
      SELECT * FROM UNNEST(${keys}::text[], ${values}::text[])
      ON CONFLICT ("key") DO NOTHING`;
    const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });
    if (!admin) {
      const email = (process.env.ADMIN_EMAIL || "admin@biologyuniverse.test").toLowerCase();
      const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "changeme123", 10);
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) await prisma.user.update({ where: { email }, data: { role: "admin" } });
      else await prisma.user.create({ data: { email, name: process.env.ADMIN_NAME || "Admin", passwordHash, role: "admin" } });
      console.log(`[the-biology-universe] Admin account ready: ${email}`);
    }
  })().catch((e) => {
    booted = null;
    throw friendlyDbError(e);
  });
  return booted;
}

/** Turns the driver's connection errors into a message that says what to check. */
function friendlyDbError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/Unable to start a transaction|Can't reach database|ECONNREFUSED|ETIMEDOUT|timeout/i.test(msg)) {
    return new Error(
      "Could not connect to PostgreSQL in time. Check that DATABASE_URL in .env is right and the database is running. " +
        "For a cloud database add ?sslmode=require to the URL. Run `npm run db:check` to test the connection.\n\n" +
        msg
    );
  }
  return e;
}

/* ---------- settings ---------- */
export async function getSettings(): Promise<Settings> {
  await ensureBootstrap();
  const rows = await prisma.setting.findMany();
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out as Settings;
}
export async function saveSettings(values: Record<string, string>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
}

/* ---------- users ---------- */
export async function getUserById(id: number) {
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? toUser(u) : undefined;
}
export async function getUserAuthByEmail(email: string) {
  const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  return u ? { ...toUser(u), password_hash: u.passwordHash } : undefined;
}
export async function createUser(u: { name: string; email: string; phone: string; password_hash: string }) {
  const r = await prisma.user.create({
    data: { name: u.name, email: u.email.toLowerCase(), phone: u.phone, passwordHash: u.password_hash },
  });
  return r.id;
}
export async function updatePassword(userId: number, hash: string) {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
}
export async function updateProfile(userId: number, name: string, phone: string) {
  await prisma.user.update({ where: { id: userId }, data: { name, phone } });
}
export async function listStudents() {
  const [users, paid, done] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { enrollments: true } } } }),
    prisma.payment.groupBy({ by: ["userId"], where: { status: "approved" }, _sum: { amount: true } }),
    prisma.lessonProgress.groupBy({ by: ["userId"], where: { completedAt: { not: null } }, _count: { _all: true } }),
  ]);
  const paidMap = new Map(paid.map((p) => [p.userId, p._sum.amount ?? 0]));
  const doneMap = new Map(done.map((d) => [d.userId, d._count._all]));
  return users.map((u) => ({
    ...toUser(u),
    course_count: u._count.enrollments,
    paid: paidMap.get(u.id) ?? 0,
    lessons_done: doneMap.get(u.id) ?? 0,
  }));
}

/* ---------- courses ---------- */
const withStats = {
  lessons: {
    select: { durationMin: true, videoUrl: true, title: true, _count: { select: { questions: true } } },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  },
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseInclude;
type DbCourseStats = Prisma.CourseGetPayload<{ include: typeof withStats }>;
const toCourseStats = (c: DbCourseStats): CourseWithStats => ({
  ...toCourse(c),
  lesson_count: c.lessons.length,
  total_min: c.lessons.reduce((a, l) => a + l.durationMin, 0),
  first_video: c.lessons.find((l) => l.videoUrl)?.videoUrl ?? null,
  student_count: c._count.enrollments,
  question_count: c.lessons.reduce((a, l) => a + l._count.questions, 0),
  lesson_titles: c.lessons.map((l) => l.title),
});

export async function listPublishedCourses() {
  const rows = await prisma.course.findMany({
    where: { published: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: withStats,
  });
  return rows.map(toCourseStats);
}
export async function listAllCourses() {
  const rows = await prisma.course.findMany({
    orderBy: [{ published: "desc" }, { updatedAt: "desc" }],
    include: withStats,
  });
  return rows.map(toCourseStats);
}
export async function getCourseBySlug(slug: string) {
  const c = await prisma.course.findUnique({ where: { slug }, include: withStats });
  return c ? toCourseStats(c) : undefined;
}
export async function getCourseById(id: number) {
  if (!Number.isInteger(id)) return undefined;
  const c = await prisma.course.findUnique({ where: { id }, include: withStats });
  return c ? toCourseStats(c) : undefined;
}
export async function slugTaken(slug: string, exceptId = 0) {
  return !!(await prisma.course.findFirst({ where: { slug, NOT: { id: exceptId } }, select: { id: true } }));
}
export async function createCourse(c: CourseInput) {
  return (await prisma.course.create({ data: fromCourse(c) })).id;
}
export async function updateCourse(id: number, c: CourseInput) {
  await prisma.course.update({ where: { id }, data: fromCourse(c) });
}
export async function setPublished(id: number, published: boolean) {
  await prisma.course.update({ where: { id }, data: { published } });
}
export async function deleteCourse(id: number) {
  await prisma.course.delete({ where: { id } });
}

/* ---------- lessons ---------- */
export async function listLessons(courseId: number): Promise<LessonWithCount[]> {
  const rows = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: { _count: { select: { questions: true } } },
  });
  return rows.map((l) => ({ ...toLesson(l), question_count: l._count.questions }));
}
export async function getLesson(id: number) {
  if (!Number.isInteger(id)) return undefined;
  const l = await prisma.lesson.findUnique({ where: { id } });
  return l ? toLesson(l) : undefined;
}
export async function createLesson(l: LessonInput & { course_id: number }) {
  const max = await prisma.lesson.aggregate({ where: { courseId: l.course_id }, _max: { position: true } });
  const [created] = await prisma.$transaction([
    prisma.lesson.create({
      data: { ...fromLesson(l), courseId: l.course_id, position: (max._max.position ?? -1) + 1 },
    }),
    prisma.course.update({ where: { id: l.course_id }, data: { updatedAt: new Date() } }),
  ]);
  return created.id;
}
export async function updateLesson(id: number, l: LessonInput) {
  await prisma.lesson.update({ where: { id }, data: fromLesson(l) });
}
export async function deleteLesson(id: number) {
  await prisma.lesson.delete({ where: { id } });
}
export async function moveLesson(id: number, dir: -1 | 1) {
  const lesson = await getLesson(id);
  if (!lesson) return;
  const list = await listLessons(lesson.course_id);
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j]!, list[i]!];
  await prisma.$transaction(list.map((l, idx) => prisma.lesson.update({ where: { id: l.id }, data: { position: idx } })));
}

/* ---------- questions ---------- */
export async function listQuestions(lessonId: number) {
  const rows = await prisma.question.findMany({ where: { lessonId }, orderBy: [{ position: "asc" }, { id: "asc" }] });
  return rows.map(toQuestion);
}
export async function saveQuestion(q: Omit<Question, "id" | "position"> & { id?: number }) {
  const data = { prompt: q.prompt, options: q.options, correctIndex: q.correct_index, explanation: q.explanation };
  if (q.id) {
    await prisma.question.updateMany({ where: { id: q.id, lessonId: q.lesson_id }, data });
    return q.id;
  }
  const max = await prisma.question.aggregate({ where: { lessonId: q.lesson_id }, _max: { position: true } });
  const r = await prisma.question.create({
    data: { ...data, lessonId: q.lesson_id, position: (max._max.position ?? -1) + 1 },
  });
  return r.id;
}
export async function deleteQuestion(id: number) {
  await prisma.question.deleteMany({ where: { id } });
}

/* ---------- payments & enrollments ---------- */
const paymentInclude = {
  user: { select: { name: true, email: true, phone: true } },
  course: { select: { title: true, slug: true, price: true } },
} satisfies Prisma.PaymentInclude;
type DbPayment = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;
const toPayment = (p: DbPayment): PaymentRow => ({
  id: p.id,
  user_id: p.userId,
  course_id: p.courseId,
  amount: p.amount,
  sender_number: p.senderNumber,
  trx_id: p.trxId,
  status: p.status,
  admin_note: p.adminNote,
  created_at: p.createdAt,
  reviewed_at: p.reviewedAt,
  user_name: p.user.name,
  user_email: p.user.email,
  user_phone: p.user.phone,
  course_title: p.course.title,
  course_slug: p.course.slug,
  course_price: p.course.price,
});

export async function listPayments(status?: PaymentStatus, q?: string) {
  const contains = (v: string) => ({ contains: v, mode: "insensitive" as const });
  const where: Prisma.PaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { trxId: contains(q) },
            { senderNumber: contains(q) },
            { user: { name: contains(q) } },
            { user: { email: contains(q) } },
            { course: { title: contains(q) } },
          ],
        }
      : {}),
  };
  const rows = await prisma.payment.findMany({
    where,
    include: paymentInclude,
    orderBy:
      status === "pending"
        ? [{ createdAt: "asc" }]
        : [{ reviewedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
  });
  return rows.map(toPayment);
}
export async function paymentCounts() {
  const rows = await prisma.payment.groupBy({ by: ["status"], _count: { _all: true } });
  const out = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) out[r.status] = r._count._all;
  return out;
}
export async function getPayment(id: number) {
  const p = await prisma.payment.findUnique({ where: { id }, include: paymentInclude });
  return p ? toPayment(p) : undefined;
}
export async function paymentsForUser(userId: number) {
  const rows = await prisma.payment.findMany({ where: { userId }, include: paymentInclude, orderBy: { createdAt: "desc" } });
  return rows.map(toPayment);
}
export async function pendingPaymentFor(userId: number, courseId: number) {
  const p = await prisma.payment.findFirst({ where: { userId, courseId, status: "pending" }, include: paymentInclude });
  return p ? toPayment(p) : undefined;
}
export async function trxExists(trx: string) {
  return !!(await prisma.payment.findFirst({ where: { trxId: { equals: trx, mode: "insensitive" } }, select: { id: true } }));
}
export async function createPayment(p: { user_id: number; course_id: number; amount: number; sender_number: string; trx_id: string }) {
  await prisma.payment.create({
    data: { userId: p.user_id, courseId: p.course_id, amount: p.amount, senderNumber: p.sender_number, trxId: p.trx_id },
  });
}
export async function approvePayment(id: number) {
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p) return;
  await prisma.$transaction([
    prisma.payment.update({ where: { id }, data: { status: "approved", adminNote: "", reviewedAt: new Date() } }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: p.userId, courseId: p.courseId } },
      update: {},
      create: { userId: p.userId, courseId: p.courseId, paymentId: id },
    }),
  ]);
}
export async function rejectPayment(id: number, note: string) {
  await prisma.$transaction([
    prisma.payment.update({ where: { id }, data: { status: "rejected", adminNote: note, reviewedAt: new Date() } }),
    // If this payment had granted access earlier, take it back.
    prisma.enrollment.deleteMany({ where: { paymentId: id } }),
  ]);
}
export async function reopenPayment(id: number) {
  await prisma.$transaction([
    prisma.enrollment.deleteMany({ where: { paymentId: id } }),
    prisma.payment.update({ where: { id }, data: { status: "pending", adminNote: "", reviewedAt: null } }),
  ]);
}
export async function enroll(userId: number, courseId: number) {
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}
export async function unenroll(userId: number, courseId: number) {
  await prisma.enrollment.deleteMany({ where: { userId, courseId } });
}
export async function isEnrolled(userId: number, courseId: number) {
  return !!(await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { id: true } }));
}
/** Completed lessons per course for one user. */
async function doneByCourse(userId: number) {
  const done = await prisma.lessonProgress.findMany({
    where: { userId, completedAt: { not: null } },
    select: { lesson: { select: { courseId: true } } },
  });
  const map = new Map<number, number>();
  for (const d of done) map.set(d.lesson.courseId, (map.get(d.lesson.courseId) ?? 0) + 1);
  return map;
}
export async function enrollmentsForUser(userId: number) {
  const [rows, done] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { course: { include: withStats } },
    }),
    doneByCourse(userId),
  ]);
  return rows.map((e) => ({
    ...toCourseStats(e.course),
    enrolled_at: e.createdAt,
    done_count: done.get(e.courseId) ?? 0,
  }));
}
export async function enrollmentsForStudents(userIds: number[]) {
  const rows = await prisma.enrollment.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { id: true, title: true, slug: true, _count: { select: { lessons: true } } } } },
  });
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: { in: userIds }, completedAt: { not: null } },
    select: { userId: true, lesson: { select: { courseId: true } } },
  });
  const key = (u: number, c: number) => `${u}:${c}`;
  const done = new Map<string, number>();
  for (const p of progress) done.set(key(p.userId, p.lesson.courseId), (done.get(key(p.userId, p.lesson.courseId)) ?? 0) + 1);
  const out = new Map<number, { id: number; title: string; slug: string; lesson_count: number; done_count: number }[]>();
  for (const e of rows) {
    const list = out.get(e.userId) ?? [];
    list.push({
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      lesson_count: e.course._count.lessons,
      done_count: done.get(key(e.userId, e.courseId)) ?? 0,
    });
    out.set(e.userId, list);
  }
  return out;
}

/* ---------- progress ---------- */
export async function progressForCourse(userId: number, courseId: number) {
  const rows = await prisma.lessonProgress.findMany({ where: { userId, lesson: { courseId } } });
  return new Map(
    rows.map((r) => [r.lessonId, { lesson_id: r.lessonId, score: r.score, attempts: r.attempts, completed_at: r.completedAt }])
  );
}
export async function recordAttempt(userId: number, lessonId: number, score: number, passed: boolean) {
  await prisma.$transaction(async (tx) => {
    const prev = await tx.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
    if (!prev) {
      await tx.lessonProgress.create({
        data: { userId, lessonId, score, attempts: 1, completedAt: passed ? new Date() : null },
      });
      return;
    }
    await tx.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        attempts: { increment: 1 },
        score: Math.max(prev.score, score),
        completedAt: prev.completedAt ?? (passed ? new Date() : null),
      },
    });
  });
}

/* ---------- admin overview ---------- */
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export async function overviewStats() {
  const [pending, pendingSum, rev30, revAll, students, enrolled, courses, drafts, lessonsDone7] = await Promise.all([
    prisma.payment.count({ where: { status: "pending" } }),
    prisma.payment.aggregate({ where: { status: "pending" }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: "approved", reviewedAt: { gte: daysAgo(30) } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({ where: { status: "approved" }, _sum: { amount: true } }),
    prisma.user.count({ where: { role: "student" } }),
    prisma.enrollment.groupBy({ by: ["userId"] }).then((r) => r.length),
    prisma.course.count({ where: { published: true } }),
    prisma.course.count({ where: { published: false } }),
    prisma.lessonProgress.count({ where: { completedAt: { gte: daysAgo(7) } } }),
  ]);
  return {
    pending,
    pendingAmount: pendingSum._sum.amount ?? 0,
    revenue30: rev30._sum.amount ?? 0,
    approved30: rev30._count._all,
    revenueAll: revAll._sum.amount ?? 0,
    students,
    enrolled,
    courses,
    drafts,
    lessonsDone7,
  };
}

/** Dhaka calendar date (UTC+6) as YYYY-MM-DD. */
const dhakaDay = (d: Date) => new Date(d.getTime() + 6 * 3600000).toISOString().slice(0, 10);

/** Approved taka per day for the last `days` days, in Dhaka dates, oldest first. */
export async function revenueByDay(days = 14) {
  const rows = await prisma.payment.findMany({
    where: { status: "approved", reviewedAt: { gte: daysAgo(days + 1) } },
    select: { amount: true, reviewedAt: true },
  });
  const map = new Map<string, { total: number; n: number }>();
  for (const r of rows) {
    const k = dhakaDay(r.reviewedAt!);
    const v = map.get(k) ?? { total: 0, n: 0 };
    v.total += r.amount;
    v.n += 1;
    map.set(k, v);
  }
  const out: { day: string; total: number; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dhakaDay(daysAgo(i));
    out.push({ day: k, total: map.get(k)?.total ?? 0, n: map.get(k)?.n ?? 0 });
  }
  return out;
}

export async function topCourses(limit = 5) {
  const [courses, revenue] = await Promise.all([
    prisma.course.findMany({
      where: { published: true },
      select: { id: true, title: true, slug: true, price: true, _count: { select: { enrollments: true } } },
    }),
    prisma.payment.groupBy({ by: ["courseId"], where: { status: "approved" }, _sum: { amount: true } }),
  ]);
  const rev = new Map(revenue.map((r) => [r.courseId, r._sum.amount ?? 0]));
  return courses
    .map((c) => ({ id: c.id, title: c.title, slug: c.slug, price: c.price, students: c._count.enrollments, revenue: rev.get(c.id) ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue || b.students - a.students)
    .slice(0, limit);
}

/* ---------- dashboard charts ---------- */
const dhakaMonth = (d: Date) => dhakaDay(d).slice(0, 7);

/** Approved taka per Dhaka month for the last `months` months, oldest first. */
export async function revenueByMonth(months = 6) {
  const now = new Date(Date.now() + 6 * 3600000);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1) - 6 * 3600000);
  const rows = await prisma.payment.findMany({
    where: { status: "approved", reviewedAt: { gte: start } },
    select: { amount: true, reviewedAt: true },
  });
  const map = new Map<string, { total: number; n: number }>();
  for (const r of rows) {
    const k = dhakaMonth(r.reviewedAt!);
    const v = map.get(k) ?? { total: 0, n: 0 };
    v.total += r.amount;
    v.n += 1;
    map.set(k, v);
  }
  const out: { key: string; label: string; total: number; n: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const k = d.toISOString().slice(0, 7);
    out.push({
      key: k,
      label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      total: map.get(k)?.total ?? 0,
      n: map.get(k)?.n ?? 0,
    });
  }
  return out;
}

export async function recentStudents(limit = 5) {
  const [rows, total, newThisWeek] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, email: true },
    }),
    prisma.user.count({ where: { role: "student" } }),
    prisma.user.count({ where: { role: "student", createdAt: { gte: daysAgo(7) } } }),
  ]);
  return { rows, total, newThisWeek };
}

/** Lessons a student passed per Dhaka day for the last `days` days, oldest first. */
export async function lessonsPassedByDay(userId: number, days = 7) {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, completedAt: { gte: daysAgo(days + 1) } },
    select: { completedAt: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = dhakaDay(r.completedAt!);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const out: { key: string; label: string; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dhakaDay(daysAgo(i));
    const label = new Date(k + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
    out.push({ key: k, label, total: map.get(k) ?? 0 });
  }
  return out;
}

/** Lessons a student passed per week for the last `weeks` weeks, oldest first. */
export async function lessonsPassedByWeek(userId: number, weeks = 6) {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, completedAt: { gte: daysAgo(weeks * 7) } },
    select: { completedAt: true },
  });
  const out: { key: string; label: string; total: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const from = daysAgo((i + 1) * 7).getTime();
    const to = daysAgo(i * 7).getTime();
    const total = rows.filter((r) => r.completedAt!.getTime() > from && r.completedAt!.getTime() <= to).length;
    out.push({ key: `w${i}`, label: i === 0 ? "This wk" : `${i}w ago`, total });
  }
  return out;
}

/** Public numbers for the landing page. */
export async function publicStats() {
  const [learners, newThisWeek] = await Promise.all([
    prisma.enrollment.groupBy({ by: ["userId"] }).then((r) => r.length),
    prisma.enrollment.count({ where: { createdAt: { gte: daysAgo(7) } } }),
  ]);
  return { learners, newThisWeek };
}

/* ---------- live classes ---------- */
export type LiveClass = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  starts_at: Date;
  duration_min: number;
  meet_url: string;
  recording_url: string;
  course_title: string;
  course_slug: string;
};
type DbLive = Prisma.LiveClassGetPayload<{ include: { course: { select: { title: true; slug: true } } } }>;
const toLive = (l: DbLive): LiveClass => ({
  id: l.id,
  course_id: l.courseId,
  title: l.title,
  description: l.description,
  starts_at: l.startsAt,
  duration_min: l.durationMin,
  meet_url: l.meetUrl,
  recording_url: l.recordingUrl,
  course_title: l.course.title,
  course_slug: l.course.slug,
});
const liveInclude = { course: { select: { title: true, slug: true } } } as const;
/** Classes that haven't finished yet (the end time is start + duration). */
const notEnded = () => ({ startsAt: { gte: new Date(Date.now() - 6 * 3600_000) } });

export async function listLiveForCourse(courseId: number) {
  const rows = await prisma.liveClass.findMany({ where: { courseId }, include: liveInclude, orderBy: { startsAt: "asc" } });
  return rows.map(toLive);
}
export async function listAllLive() {
  const rows = await prisma.liveClass.findMany({ include: liveInclude, orderBy: { startsAt: "desc" } });
  return rows.map(toLive);
}
/** Upcoming or running classes in the courses this student has. */
export async function upcomingLiveForUser(userId: number, limit = 5) {
  const rows = await prisma.liveClass.findMany({
    where: { ...notEnded(), course: { enrollments: { some: { userId } } } },
    include: liveInclude,
    orderBy: { startsAt: "asc" },
    take: limit * 2,
  });
  return rows.map(toLive).filter((l) => l.starts_at.getTime() + l.duration_min * 60_000 > Date.now()).slice(0, limit);
}
export async function upcomingLiveAll(limit = 5) {
  const rows = await prisma.liveClass.findMany({ where: notEnded(), include: liveInclude, orderBy: { startsAt: "asc" }, take: limit * 2 });
  return rows.map(toLive).filter((l) => l.starts_at.getTime() + l.duration_min * 60_000 > Date.now()).slice(0, limit);
}
export async function nextLiveForCourse(courseId: number) {
  const rows = await prisma.liveClass.findMany({
    where: { courseId, ...notEnded() },
    include: liveInclude,
    orderBy: { startsAt: "asc" },
    take: 3,
  });
  return rows.map(toLive).find((l) => l.starts_at.getTime() + l.duration_min * 60_000 > Date.now());
}
export async function getLive(id: number) {
  const l = await prisma.liveClass.findUnique({ where: { id }, include: liveInclude });
  return l ? toLive(l) : undefined;
}
export async function saveLive(v: {
  id?: number;
  course_id: number;
  title: string;
  description: string;
  starts_at: Date;
  duration_min: number;
  meet_url: string;
  recording_url: string;
}) {
  const data = {
    title: v.title,
    description: v.description,
    startsAt: v.starts_at,
    durationMin: v.duration_min,
    meetUrl: v.meet_url,
    recordingUrl: v.recording_url,
  };
  if (v.id) {
    await prisma.liveClass.update({ where: { id: v.id }, data });
    return v.id;
  }
  return (await prisma.liveClass.create({ data: { ...data, courseId: v.course_id } })).id;
}
export async function deleteLive(id: number) {
  await prisma.liveClass.deleteMany({ where: { id } });
}

/* ---------- materials ---------- */
export type Material = {
  id: number;
  course_id: number;
  lesson_id: number | null;
  lesson_title: string | null;
  title: string;
  kind: "file" | "link";
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
  storage_key: string;
  created_at: Date;
};
type DbMaterial = Prisma.MaterialGetPayload<{ include: { lesson: { select: { title: true } } } }>;
const toMaterial = (m: DbMaterial): Material => ({
  id: m.id,
  course_id: m.courseId,
  lesson_id: m.lessonId,
  lesson_title: m.lesson?.title ?? null,
  title: m.title,
  kind: m.kind,
  url: m.url,
  file_name: m.fileName,
  mime_type: m.mimeType,
  size: m.size,
  storage_key: m.storageKey,
  created_at: m.createdAt,
});
export async function listMaterials(courseId: number) {
  const rows = await prisma.material.findMany({
    where: { courseId },
    include: { lesson: { select: { title: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toMaterial);
}
export async function getMaterial(id: number) {
  if (!Number.isInteger(id)) return undefined;
  const m = await prisma.material.findUnique({ where: { id }, include: { lesson: { select: { title: true } } } });
  return m ? toMaterial(m) : undefined;
}
export async function createMaterial(v: Omit<Material, "id" | "created_at" | "lesson_title">) {
  return (
    await prisma.material.create({
      data: {
        courseId: v.course_id,
        lessonId: v.lesson_id,
        title: v.title,
        kind: v.kind,
        url: v.url,
        fileName: v.file_name,
        mimeType: v.mime_type,
        size: v.size,
        storageKey: v.storage_key,
      },
    })
  ).id;
}
export async function deleteMaterial(id: number) {
  await prisma.material.deleteMany({ where: { id } });
}
export async function courseExtrasCount(courseId: number) {
  const [materials, live] = await Promise.all([
    prisma.material.count({ where: { courseId } }),
    prisma.liveClass.count({ where: { courseId } }),
  ]);
  return { materials, live };
}

/** Topics, teachers and live classes for the public homepage. No meeting links leave this function. */
export async function homepageData() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    select: {
      category: true,
      instructor: true,
      _count: { select: { enrollments: true, lessons: true } },
    },
  });
  const topics = new Map<string, number>();
  const teachers = new Map<string, { courses: number; students: number; lessons: number }>();
  for (const c of courses) {
    if (c.category) topics.set(c.category, (topics.get(c.category) ?? 0) + 1);
    if (c.instructor) {
      const t = teachers.get(c.instructor) ?? { courses: 0, students: 0, lessons: 0 };
      t.courses += 1;
      t.students += c._count.enrollments;
      t.lessons += c._count.lessons;
      teachers.set(c.instructor, t);
    }
  }
  const live = await prisma.liveClass.findMany({
    where: { startsAt: { gte: new Date(Date.now() - 6 * 3600_000) }, course: { published: true } },
    orderBy: { startsAt: "asc" },
    take: 8,
    select: {
      id: true,
      title: true,
      startsAt: true,
      durationMin: true,
      course: { select: { title: true, slug: true, instructor: true } },
    },
  });
  return {
    topics: [...topics.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    teachers: [...teachers.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.students - a.students || b.courses - a.courses),
    live: live
      .filter((l) => l.startsAt.getTime() + l.durationMin * 60_000 > Date.now())
      .slice(0, 4)
      .map((l) => ({
        id: l.id,
        title: l.title,
        starts_at: l.startsAt,
        duration_min: l.durationMin,
        course_title: l.course.title,
        course_slug: l.course.slug,
        teacher: l.course.instructor,
      })),
  };
}

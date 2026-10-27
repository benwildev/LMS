"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import * as data from "@/lib/data";
import { slugify } from "@/lib/format";
import { parseVideo } from "@/lib/video";
import type { FormState } from "./auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string, d = 0) => {
  const n = parseInt(String(f.get(k) ?? ""), 10);
  return Number.isFinite(n) ? n : d;
};
function refresh() {
  revalidatePath("/", "layout");
}

/* ---------- payments ---------- */
export async function approvePayment(id: number) {
  await requireAdmin();
  await data.approvePayment(id);
  refresh();
}
export async function rejectPayment(id: number, form: FormData) {
  await requireAdmin();
  await data.rejectPayment(id, str(form, "note") || "We couldn’t find this transaction in our bKash statement.");
  refresh();
}
export async function reopenPayment(id: number) {
  await requireAdmin();
  await data.reopenPayment(id);
  refresh();
}

/* ---------- courses ---------- */
async function readCourse(form: FormData, exceptId = 0): Promise<{ error?: string; value?: data.CourseInput }> {
  const title = str(form, "title");
  if (title.length < 3) return { error: "Give the course a title of at least 3 characters." };
  let slug = slugify(str(form, "slug") || title);
  if (await data.slugTaken(slug, exceptId)) {
    let i = 2;
    while (await data.slugTaken(`${slug}-${i}`, exceptId)) i++;
    slug = `${slug}-${i}`;
  }
  const preview = str(form, "preview_url");
  if (preview && !parseVideo(preview)) return { error: "The preview link must be a video file, HLS, Bunny Stream, Vimeo, YouTube or Google Drive link." };
  const price = int(form, "price", -1);
  if (price < 0) return { error: "Price must be 0 or more (0 makes the course free)." };
  return {
    value: {
      slug,
      title,
      subtitle: str(form, "subtitle"),
      description: str(form, "description"),
      price,
      thumbnail_url: str(form, "thumbnail_url"),
      preview_url: preview,
      level: str(form, "level"),
      language: str(form, "language"),
      category: str(form, "category"),
      instructor: str(form, "instructor"),
      compare_price: Math.max(0, int(form, "compare_price", 0)),
      published: !!form.get("published"),
    },
  };
}

export async function createCourse(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { error, value } = await readCourse(form);
  if (error || !value) return { error };
  const id = await data.createCourse(value);
  refresh();
  redirect(`/admin/courses/${id}?saved=1`);
}

export async function updateCourse(id: number, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { error, value } = await readCourse(form, id);
  if (error || !value) return { error };
  if (value.published && !(await data.listLessons(id)).length)
    return { error: "Add at least one lesson before publishing the course." };
  await data.updateCourse(id, value);
  refresh();
  return { ok: "Saved" };
}

export async function togglePublish(id: number) {
  await requireAdmin();
  const c = await data.getCourseById(id);
  if (!c) return;
  if (!c.published && !c.lesson_count) redirect(`/admin/courses/${id}?error=nolessons`);
  await data.setPublished(id, !c.published);
  refresh();
}

export async function deleteCourse(id: number) {
  await requireAdmin();
  await data.deleteCourse(id);
  refresh();
  redirect("/admin/courses");
}

/* ---------- lessons ---------- */
function readLesson(form: FormData) {
  const title = str(form, "title");
  const video_url = str(form, "video_url");
  if (title.length < 2) return { error: "Give the lesson a title." };
  if (!video_url) return { error: "Paste the lesson’s video link." };
  if (!parseVideo(video_url))
    return { error: "That link isn’t a video we can play. Use a .mp4/.webm/.m3u8 link, or a Bunny Stream, Vimeo, YouTube or Google Drive link." };
  const pass = Math.min(100, Math.max(0, int(form, "pass_percent", 70)));
  return {
    value: {
      title,
      description: str(form, "description"),
      video_url,
      duration_min: Math.max(0, int(form, "duration_min", 0)),
      is_preview: !!form.get("is_preview"),
      pass_percent: pass,
    },
  };
}

export async function addLesson(courseId: number, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { error, value } = readLesson(form);
  if (error || !value) return { error, fields: { title: str(form, "title"), video_url: str(form, "video_url") } };
  const id = await data.createLesson({ ...value, course_id: courseId });
  refresh();
  redirect(`/admin/courses/${courseId}/lessons/${id}?new=1`);
}

export async function updateLesson(id: number, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { error, value } = readLesson(form);
  if (error || !value) return { error };
  await data.updateLesson(id, value);
  refresh();
  return { ok: "Saved" };
}

export async function deleteLesson(id: number) {
  await requireAdmin();
  const l = await data.getLesson(id);
  if (!l) return;
  await data.deleteLesson(id);
  refresh();
  redirect(`/admin/courses/${l.course_id}`);
}

export async function moveLesson(id: number, dir: -1 | 1) {
  await requireAdmin();
  await data.moveLesson(id, dir);
  refresh();
}

/* ---------- questions ---------- */
export async function saveQuestion(lessonId: number, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const prompt = str(form, "prompt");
  const options = form
    .getAll("option")
    .map((o) => String(o).trim())
    .filter(Boolean);
  const correct = int(form, "correct", -1);
  const id = int(form, "id", 0) || undefined;
  if (prompt.length < 3) return { error: "Write the question." };
  if (options.length < 2) return { error: "A question needs at least two answers." };
  if (correct < 0 || correct >= options.length) return { error: "Mark which answer is correct." };
  await data.saveQuestion({ id, lesson_id: lessonId, prompt, options, correct_index: correct, explanation: str(form, "explanation") });
  refresh();
  return { ok: id ? "Question saved" : "Question added" };
}

export async function deleteQuestion(id: number) {
  await requireAdmin();
  await data.deleteQuestion(id);
  refresh();
}

/* ---------- students ---------- */
export async function grantAccess(userId: number, form: FormData) {
  await requireAdmin();
  const courseId = int(form, "courseId", 0);
  if (courseId) await data.enroll(userId, courseId);
  refresh();
}
export async function revokeAccess(userId: number, courseId: number) {
  await requireAdmin();
  await data.unenroll(userId, courseId);
  refresh();
}

/* ---------- settings ---------- */
export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const bkash = str(form, "bkash_number").replace(/[^\d]/g, "");
  if (!/^01[3-9]\d{8}$/.test(bkash)) return { error: "The bKash number should be 11 digits starting with 01." };
  const site = str(form, "site_name");
  if (!site) return { error: "Give the school a name." };
  await data.saveSettings({
    site_name: site,
    tagline: str(form, "tagline"),
    bkash_number: bkash,
    bkash_type: str(form, "bkash_type") || "Personal",
    payment_note: str(form, "payment_note"),
    support_email: str(form, "support_email"),
    support_phone: str(form, "support_phone"),
    announcement: str(form, "announcement"),
    hero_title: str(form, "hero_title"),
    hero_subtitle: str(form, "hero_subtitle"),
    hero_image_url: str(form, "hero_image_url"),
  });
  refresh();
  return { ok: "Saved" };
}

/* ---------- live classes ---------- */
const MEET = /^https:\/\/(meet\.google\.com|([\w-]+\.)?zoom\.us|teams\.microsoft\.com|teams\.live\.com|([\w-]+\.)?webex\.com|meet\.jit\.si)\//i;

export async function saveLiveClass(courseId: number, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { fromDhakaInput } = await import("@/lib/time");
  const title = str(form, "title");
  const startsAt = fromDhakaInput(str(form, "starts_at"));
  const meet = str(form, "meet_url");
  const recording = str(form, "recording_url");
  const id = int(form, "id", 0) || undefined;
  const fields = {
    title,
    starts_at: str(form, "starts_at"),
    meet_url: meet,
    duration_min: str(form, "duration_min"),
    description: str(form, "description"),
  };
  if (title.length < 3) return { error: "Give the class a title.", fields };
  if (!startsAt) return { error: "Pick the date and start time.", fields };
  if (!id && startsAt.getTime() < Date.now() - 5 * 60_000) return { error: "That time has already passed.", fields };
  if (!/^https:\/\//i.test(meet)) return { error: "Paste the full meeting link, starting with https://", fields };
  if (!MEET.test(meet) && !form.get("any_link"))
    return {
      error: "That doesn’t look like a Google Meet, Zoom, Teams, Webex or Jitsi link. Tick “Other platform” to use it anyway.",
      fields,
    };
  if (recording && !/^https:\/\//i.test(recording)) return { error: "The recording link must start with https://", fields };
  const duration = Math.min(600, Math.max(10, int(form, "duration_min", 60)));
  await data.saveLive({
    id,
    course_id: courseId,
    title,
    description: str(form, "description"),
    starts_at: startsAt,
    duration_min: duration,
    meet_url: meet,
    recording_url: recording,
  });
  refresh();
  return { ok: id ? "Saved" : "Class scheduled" };
}

export async function deleteLiveClass(id: number) {
  await requireAdmin();
  await data.deleteLive(id);
  refresh();
}

/* ---------- materials ---------- */
export async function addMaterial(courseId: number, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { saveUpload, detectType, MAX_UPLOAD_MB } = await import("@/lib/storage");
  const title = str(form, "title");
  const lessonId = int(form, "lesson_id", 0) || null;
  const link = str(form, "url");
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (lessonId) {
    const l = await data.getLesson(lessonId);
    if (!l || l.course_id !== courseId) return { error: "That lesson isn’t in this course." };
  }
  if (hasFile) {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return { error: `Files can be up to ${MAX_UPLOAD_MB} MB. Put bigger files on Google Drive and add the link instead.` };
    if (!detectType(file)) return { error: "Upload a PDF, image, Word, PowerPoint, Excel, text or zip file." };
    const { key, type } = await saveUpload(file, courseId);
    await data.createMaterial({
      course_id: courseId,
      lesson_id: lessonId,
      title: title || file.name.replace(/\.[^.]+$/, ""),
      kind: "file",
      url: "",
      file_name: file.name.slice(0, 200),
      mime_type: type,
      size: file.size,
      storage_key: key,
    });
  } else if (link) {
    if (!/^https:\/\//i.test(link)) return { error: "The link must start with https://" };
    if (title.length < 2) return { error: "Give the link a title so students know what it is." };
    await data.createMaterial({
      course_id: courseId,
      lesson_id: lessonId,
      title,
      kind: "link",
      url: link,
      file_name: "",
      mime_type: "",
      size: 0,
      storage_key: "",
    });
  } else {
    return { error: "Choose a file to upload, or paste a link." };
  }
  refresh();
  return { ok: "Added" };
}

export async function deleteMaterial(id: number) {
  await requireAdmin();
  const m = await data.getMaterial(id);
  if (!m) return;
  await data.deleteMaterial(id);
  if (m.storage_key) {
    const { removeUpload } = await import("@/lib/storage");
    await removeUpload(m.storage_key);
  }
  refresh();
}

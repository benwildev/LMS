import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/** Uploaded materials live on disk outside /public, so every download goes through the access check. */
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 25);

export const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/zip": "zip",
  "text/plain": "txt",
};

/** Some browsers send an empty or generic type; fall back to the file's extension. */
export function detectType(file: File) {
  if (file.type && ALLOWED[file.type]) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return Object.entries(ALLOWED).find(([, e]) => e === ext || (ext === "jpeg" && e === "jpg"))?.[0] ?? "";
}

export async function saveUpload(file: File, courseId: number) {
  const type = detectType(file);
  const key = `${courseId}/${crypto.randomUUID()}.${ALLOWED[type]}`;
  const full = path.join(UPLOAD_DIR, key);
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, Buffer.from(await file.arrayBuffer()));
  return { key, type };
}

export function uploadPath(key: string) {
  const full = path.resolve(UPLOAD_DIR, key);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) throw new Error("Bad storage key");
  return full;
}

export async function removeUpload(key: string) {
  if (!key) return;
  await fs.promises.rm(uploadPath(key), { force: true });
}

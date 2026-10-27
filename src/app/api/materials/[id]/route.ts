import fs from "fs";
import { Readable } from "stream";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCourseById, getMaterial, isEnrolled } from "@/lib/data";
import { uploadPath } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Sends a course material only to admins and students enrolled in its course. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const m = await getMaterial(Number(params.id));
  if (!m) return new NextResponse("Not found", { status: 404 });

  const user = await getCurrentUser();
  if (!user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (user.role !== "admin" && !(await isEnrolled(user.id, m.course_id))) {
    const course = await getCourseById(m.course_id);
    return NextResponse.redirect(new URL(course ? `/courses/${course.slug}` : "/", req.url));
  }

  if (m.kind === "link") return NextResponse.redirect(m.url);

  let full: string;
  try {
    full = uploadPath(m.storage_key);
    await fs.promises.access(full);
  } catch {
    return new NextResponse("This file is missing on the server.", { status: 410 });
  }
  const inline = m.mime_type === "application/pdf" || m.mime_type.startsWith("image/") || m.mime_type === "text/plain";
  const download = req.nextUrl.searchParams.has("download");
  const name = encodeURIComponent(m.file_name || `${m.title}`);
  const stream = Readable.toWeb(fs.createReadStream(full)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": m.mime_type || "application/octet-stream",
      "Content-Length": String(m.size),
      "Content-Disposition": `${inline && !download ? "inline" : "attachment"}; filename*=UTF-8''${name}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

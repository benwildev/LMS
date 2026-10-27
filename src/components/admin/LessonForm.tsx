"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import Submit from "@/components/Submit";
import VideoPlayer from "@/components/VideoPlayer";
import { parseVideo } from "@/lib/video";
import type { FormState } from "@/app/actions/auth";

type Values = {
  title: string;
  description: string;
  video_url: string;
  duration_min: number;
  is_preview: boolean;
  pass_percent: number;
};

export default function LessonForm({
  action,
  initial,
  submitLabel,
  compact = false,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  initial?: Partial<Values>;
  submitLabel: string;
  compact?: boolean;
}) {
  const [state, formAction] = useFormState(action, {});
  const [url, setUrl] = useState(initial?.video_url ?? "");
  const src = parseVideo(url);

  return (
    <form action={formAction} className="fields">
      <label className="field">
        <span>Lesson title</span>
        <input className="input" name="title" required defaultValue={state.fields?.title ?? initial?.title} />
      </label>
      <label className="field">
        <span>Video link</span>
        <input
          className="input"
          name="video_url"
          required
          defaultValue={state.fields?.video_url ?? initial?.video_url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/lesson-1.mp4, …/playlist.m3u8, or a YouTube / Vimeo / Bunny link"
        />
        <small>
          {url && !src
            ? "Not recognised yet. Paste a video file link (.mp4, .webm), an HLS stream (.m3u8), or a Bunny Stream, Vimeo, YouTube or Google Drive link."
            : src
              ? src.ownPlayer
                ? `${src.label}: plays in your own player, with no third-party logo.`
                : src.kind === "youtube"
                  ? "YouTube video: YouTube’s logo and title stay visible (their terms require it). For no branding, use a video file, HLS or Bunny Stream link."
                  : `${src.label} video found.`
              : "Best: a video file or HLS link (e.g. from Bunny Stream or Cloudflare Stream), which plays in your own player. YouTube (unlisted), Vimeo and Google Drive links work too."}
        </small>
      </label>
      {!compact && src && <VideoPlayer key={src.embedUrl} url={url} title={initial?.title ?? "Preview"} />}
      {!compact && (
        <label className="field">
          <span>Notes under the video (optional)</span>
          <textarea name="description" rows={4} defaultValue={initial?.description} />
        </label>
      )}
      <div className="fields-2">
        <label className="field">
          <span>Length (minutes)</span>
          <input className="input num" name="duration_min" type="number" min={0} defaultValue={initial?.duration_min ?? ""} />
        </label>
        <label className="field">
          <span>Pass mark (%)</span>
          <input
            className="input num"
            name="pass_percent"
            type="number"
            min={0}
            max={100}
            defaultValue={initial?.pass_percent ?? 70}
          />
          <small>Share of questions the student must get right.</small>
        </label>
      </div>
      <label className="check">
        <input type="checkbox" name="is_preview" defaultChecked={!!initial?.is_preview} />
        <span>
          <b>Free preview</b>
          <small>Anyone can watch this lesson on the course page before paying.</small>
        </span>
      </label>
      <div className="form-foot">
        <Submit className="btn" pending="Saving…">
          {submitLabel}
        </Submit>
        {state.ok && <span className="stamp">{state.ok}</span>}
        {state.error && (
          <span className="err" role="alert">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

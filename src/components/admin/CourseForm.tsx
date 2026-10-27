"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import Submit from "@/components/Submit";
import Cover from "@/components/Cover";
import { parseVideo } from "@/lib/video";
import type { FormState } from "@/app/actions/auth";

type CourseValues = {
  title: string;
  slug: string;
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
};

export default function CourseForm({
  action,
  initial,
  submitLabel,
  canPublish,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  initial?: Partial<CourseValues>;
  submitLabel: string;
  canPublish: boolean;
}) {
  const [state, formAction] = useFormState(action, {});
  const [thumb, setThumb] = useState(initial?.thumbnail_url ?? "");
  const [preview, setPreview] = useState(initial?.preview_url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const coverSrc = thumb || parseVideo(preview)?.thumb || null;

  return (
    <form action={formAction} className="fields">
      <label className="field">
        <span>Title</span>
        <input className="input" name="title" required defaultValue={initial?.title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>One-line promise</span>
        <input
          className="input"
          name="subtitle"
          defaultValue={initial?.subtitle}
          placeholder="What the student can do after the course"
        />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea name="description" rows={6} defaultValue={initial?.description} />
        <small>Leave an empty line between paragraphs.</small>
      </label>
      <div className="fields-3">
        <label className="field">
          <span>Price (৳)</span>
          <input className="input num" name="price" type="number" min={0} step={1} required defaultValue={initial?.price ?? 0} />
          <small>0 makes it free.</small>
        </label>
        <label className="field">
          <span>Level</span>
          <input className="input" name="level" defaultValue={initial?.level} placeholder="Beginner" />
        </label>
        <label className="field">
          <span>Language</span>
          <input className="input" name="language" defaultValue={initial?.language} placeholder="Bangla" />
        </label>
      </div>
      <div className="fields-3">
        <label className="field">
          <span>Category</span>
          <input className="input" name="category" defaultValue={initial?.category} placeholder="Spoken English" />
          <small>Becomes a filter on the landing page.</small>
        </label>
        <label className="field">
          <span>Instructor</span>
          <input className="input" name="instructor" defaultValue={initial?.instructor} placeholder="Teacher’s name" />
        </label>
        <label className="field">
          <span>Original price (৳, optional)</span>
          <input
            className="input num"
            name="compare_price"
            type="number"
            min={0}
            step={1}
            defaultValue={initial?.compare_price || ""}
          />
          <small>Shown crossed out when it’s higher than the price.</small>
        </label>
      </div>
      <label className="field">
        <span>Preview video (optional)</span>
        <input
          className="input"
          name="preview_url"
          defaultValue={initial?.preview_url}
          onChange={(e) => setPreview(e.target.value)}
          placeholder="https://…/lesson-1.mp4, …/playlist.m3u8, or a YouTube / Vimeo / Bunny link"
        />
        <small>Plays for everyone on the course page. Any lesson video link works here.</small>
      </label>
      <div className="fields-2">
        <label className="field">
          <span>Cover image link (optional)</span>
          <input
            className="input"
            name="thumbnail_url"
            defaultValue={initial?.thumbnail_url}
            onChange={(e) => setThumb(e.target.value)}
            placeholder="https://…/cover.jpg"
          />
          <small>Without one, the preview video’s frame is used, or a cover is drawn from the title.</small>
        </label>
        <div className="field">
          <span>Cover</span>
          <div style={{ aspectRatio: "16/9", borderRadius: 8, overflow: "hidden" }}>
            <Cover key={coverSrc ?? "none"} src={coverSrc} title={title || "Course title"} />
          </div>
        </div>
      </div>
      {initial?.slug !== undefined && (
        <label className="field">
          <span>Web address</span>
          <input className="input" name="slug" defaultValue={initial.slug} />
          <small>/courses/{initial.slug}</small>
        </label>
      )}
      <label className="check">
        <input type="checkbox" name="published" defaultChecked={!!initial?.published} disabled={!canPublish} />
        <span>
          <b>Published</b>
          <small>
            {canPublish ? "Shown on the landing page and open for purchase." : "Add a lesson first, then you can publish."}
          </small>
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

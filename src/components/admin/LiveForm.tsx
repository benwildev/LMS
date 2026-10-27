"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import Submit from "@/components/Submit";
import type { FormState } from "@/app/actions/auth";

type Values = {
  id?: number;
  title: string;
  description: string;
  starts_at: string; // datetime-local, Dhaka time
  duration_min: number;
  meet_url: string;
  recording_url: string;
};

export default function LiveForm({
  action,
  initial,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  initial?: Values;
}) {
  const [state, formAction] = useFormState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && !initial) ref.current?.reset();
  }, [state, initial]);
  const f = state.fields;
  return (
    <form ref={ref} action={formAction} className="fields">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="field">
        <span>Title</span>
        <input className="input" name="title" required defaultValue={f?.title ?? initial?.title} placeholder="Live Q&A: week 1" />
      </label>
      <div className="fields-2">
        <label className="field">
          <span>Starts (Dhaka time)</span>
          <input
            className="input"
            type="datetime-local"
            name="starts_at"
            required
            defaultValue={f?.starts_at ?? initial?.starts_at}
          />
        </label>
        <label className="field">
          <span>Length (minutes)</span>
          <input
            className="input num"
            type="number"
            name="duration_min"
            min={10}
            max={600}
            step={5}
            defaultValue={f?.duration_min ?? initial?.duration_min ?? 60}
          />
        </label>
      </div>
      <label className="field">
        <span>Meeting link</span>
        <input
          className="input"
          name="meet_url"
          required
          defaultValue={f?.meet_url ?? initial?.meet_url}
          placeholder="https://meet.google.com/abc-defg-hij"
        />
        <small>Only students enrolled in this course see it. Their Join button opens 15 minutes before the start.</small>
      </label>
      <label className="check">
        <input type="checkbox" name="any_link" />
        <span>
          <b>Other platform</b>
          <small>Allow a link that isn’t Google Meet, Zoom, Teams, Webex or Jitsi.</small>
        </span>
      </label>
      <label className="field">
        <span>Notes for students (optional)</span>
        <textarea name="description" rows={2} defaultValue={f?.description ?? initial?.description} placeholder="What we’ll cover, what to prepare" style={{ minHeight: 64 }} />
      </label>
      {initial?.id && (
        <label className="field">
          <span>Recording link (after the class)</span>
          <input
            className="input"
            name="recording_url"
            defaultValue={initial?.recording_url}
            placeholder="Unlisted YouTube or Google Drive link"
          />
          <small>Once the class ends, students see “Watch recording” instead of “Join”.</small>
        </label>
      )}
      <div className="form-foot">
        <Submit className="btn" pending="Saving…">
          {initial?.id ? "Save class" : "Schedule class"}
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

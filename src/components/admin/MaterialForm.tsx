"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Submit from "@/components/Submit";
import type { FormState } from "@/app/actions/auth";

export default function MaterialForm({
  action,
  lessons,
  maxMb,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  lessons: { id: number; title: string }[];
  maxMb: number;
}) {
  const [state, formAction] = useFormState(action, {});
  const [mode, setMode] = useState<"file" | "link">("file");
  const [picked, setPicked] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setPicked(null);
    }
  }, [state]);

  const tooBig = picked && picked.size > maxMb * 1024 * 1024;

  return (
    <form ref={ref} action={formAction} className="fields">
      <div className="seg seg-inline" role="tablist" aria-label="Material type">
        <button type="button" role="tab" aria-selected={mode === "file"} className={mode === "file" ? "on" : ""} onClick={() => setMode("file")}>
          Upload a file
        </button>
        <button type="button" role="tab" aria-selected={mode === "link"} className={mode === "link" ? "on" : ""} onClick={() => setMode("link")}>
          Add a link
        </button>
      </div>

      {mode === "file" ? (
        <label
          className={`drop${drag ? " is-drag" : ""}${picked ? " has-file" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f && input.current) {
              const dt = new DataTransfer();
              dt.items.add(f);
              input.current.files = dt.files;
              setPicked(f);
            }
          }}
        >
          <input
            ref={input}
            type="file"
            name="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
            onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
          />
          {picked ? (
            <>
              <b>{picked.name}</b>
              <small className={tooBig ? "err" : ""}>
                {(picked.size / 1024 / 1024).toFixed(1)} MB{tooBig ? ` · too big, the limit is ${maxMb} MB` : " · ready to upload"}
              </small>
            </>
          ) : (
            <>
              <b>Drop a file here, or click to choose</b>
              <small>PDF, image, Word, PowerPoint, Excel, text or zip · up to {maxMb} MB</small>
            </>
          )}
        </label>
      ) : (
        <label className="field">
          <span>Link</span>
          <input className="input" name="url" placeholder="https://drive.google.com/…" />
          <small>For big files, folders or anything already online. Share Drive links as “Anyone with the link”.</small>
        </label>
      )}

      <div className="fields-2">
        <label className="field">
          <span>Title{mode === "file" ? " (optional)" : ""}</span>
          <input className="input" name="title" placeholder={mode === "file" ? "Uses the file name if empty" : "Practice worksheet"} />
        </label>
        <label className="field">
          <span>Belongs to</span>
          <select name="lesson_id" defaultValue="">
            <option value="">Whole course</option>
            {lessons.map((l, i) => (
              <option key={l.id} value={l.id}>
                Lesson {i + 1}: {l.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-foot">
        <Submit className="btn" pending={mode === "file" ? "Uploading…" : "Saving…"} disabled={!!tooBig}>
          {mode === "file" ? "Upload" : "Add link"}
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

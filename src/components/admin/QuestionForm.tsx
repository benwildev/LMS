"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Submit from "@/components/Submit";
import Icon from "@/components/Icon";
import type { FormState } from "@/app/actions/auth";

type Q = { id?: number; prompt: string; options: string[]; correct_index: number; explanation: string };

export default function QuestionForm({
  action,
  initial,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  initial?: Q;
}) {
  const [state, formAction] = useFormState(action, {});
  const blank = { prompt: "", options: ["", "", ""], correct_index: 0, explanation: "" };
  const [q, setQ] = useState<Q>(initial ?? blank);
  const formRef = useRef<HTMLFormElement>(null);
  const [round, setRound] = useState(0);

  // After adding a new question, clear the form for the next one.
  useEffect(() => {
    if (state.ok && !initial) {
      setQ(blank);
      setRound((r) => r + 1);
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const setOpt = (i: number, v: string) => setQ({ ...q, options: q.options.map((o, j) => (j === i ? v : o)) });
  const removeOpt = (i: number) =>
    setQ({
      ...q,
      options: q.options.filter((_, j) => j !== i),
      correct_index: q.correct_index === i ? 0 : q.correct_index > i ? q.correct_index - 1 : q.correct_index,
    });

  return (
    <form ref={formRef} action={formAction} className="fields" key={round}>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="field">
        <span>Question</span>
        <textarea
          name="prompt"
          rows={2}
          required
          value={q.prompt}
          onChange={(e) => setQ({ ...q, prompt: e.target.value })}
          style={{ minHeight: 64 }}
        />
      </label>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <span>Answers · choose the correct one</span>
        {q.options.map((o, i) => (
          <div className="opt-row" key={i}>
            <input
              type="radio"
              name="correct"
              value={i}
              checked={q.correct_index === i}
              onChange={() => setQ({ ...q, correct_index: i })}
              aria-label={`Answer ${i + 1} is correct`}
            />
            <input
              className="input"
              name="option"
              value={o}
              onChange={(e) => setOpt(i, e.target.value)}
              placeholder={`Answer ${i + 1}`}
              required={i < 2}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => removeOpt(i)}
              disabled={q.options.length <= 2}
              aria-label={`Remove answer ${i + 1}`}
            >
              <Icon name="x" />
            </button>
          </div>
        ))}
        {q.options.length < 6 && (
          <button type="button" className="textbtn" style={{ justifySelf: "start" }} onClick={() => setQ({ ...q, options: [...q.options, ""] })}>
            Add an answer
          </button>
        )}
      </fieldset>
      <label className="field">
        <span>Why it’s right (optional)</span>
        <input
          className="input"
          name="explanation"
          value={q.explanation}
          onChange={(e) => setQ({ ...q, explanation: e.target.value })}
          placeholder="Shown after the student passes"
        />
      </label>
      <div className="form-foot">
        <Submit className={initial ? "btn btn-ghost btn-sm" : "btn btn-sm"} pending="Saving…">
          {initial ? "Save question" : "Add question"}
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

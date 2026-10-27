"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitQuiz, type QuizResult } from "@/app/actions/student";

type Q = { id: number; prompt: string; options: string[] };

export default function Quiz({
  lessonId,
  questions,
  passPercent,
  best,
  attempts,
  nextHref,
  courseDoneHref,
}: {
  lessonId: number;
  questions: Q[];
  passPercent: number;
  best: number | null;
  attempts: number;
  nextHref: string | null;
  courseDoneHref: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, start] = useTransition();
  const passedBefore = best !== null;
  const needed = Math.ceil((questions.length * passPercent) / 100);
  const answered = answers.filter((a) => a >= 0).length;

  const submit = () =>
    start(async () => {
      const r = await submitQuiz(lessonId, answers);
      setResult(r);
      router.refresh();
    });

  const retry = () => {
    setResult(null);
    setAnswers(questions.map(() => -1));
  };

  const after = (passed: boolean) =>
    passed ? (
      nextHref ? (
        <Link className="btn" href={nextHref}>
          Next lesson
        </Link>
      ) : (
        <Link className="btn" href={courseDoneHref}>
          Course complete · back to my courses
        </Link>
      )
    ) : (
      <button type="button" className="btn btn-ghost" onClick={retry}>
        Try again
      </button>
    );

  if (questions.length === 0) {
    return (
      <section className="quiz">
        <header>
          <h2>Finished watching?</h2>
        </header>
        <div className={`verdict ${passedBefore || result?.passed ? "pass" : ""}`} style={{ marginTop: 8 }}>
          <span>
            {passedBefore || result?.passed
              ? "Marked as done."
              : "This lesson has no questions. Mark it done to open the next one."}
          </span>
          {passedBefore || result?.passed ? (
            after(true)
          ) : (
            <button type="button" className="btn" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Mark as done"}
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="quiz" aria-labelledby="quiz-title">
      <header>
        <h2 id="quiz-title">Check what you learned</h2>
        <span className="num">
          {needed} of {questions.length} right to pass
          {passedBefore ? ` · passed with ${best}%` : attempts ? ` · ${attempts} ${attempts === 1 ? "try" : "tries"}` : ""}
        </span>
      </header>
      {questions.map((q, qi) => {
        const r = result?.results[qi];
        return (
          <fieldset key={q.id} disabled={!!result || busy}>
            <legend>
              <small className="num">{qi + 1}.</small>
              {q.prompt}
            </legend>
            <div className="opts">
              {q.options.map((o, oi) => {
                const picked = answers[qi] === oi;
                let cls = "opt";
                if (r) {
                  if (r.correctIndex === oi) cls += " right";
                  else if (picked) cls += r.correct ? " right" : " wrong";
                } else if (picked) cls += " picked";
                return (
                  <label key={oi} className={cls}>
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      checked={picked}
                      onChange={() => setAnswers(answers.map((a, j) => (j === qi ? oi : a)))}
                    />
                    {o}
                  </label>
                );
              })}
            </div>
            {r?.explanation && <p className="why">{r.explanation}</p>}
          </fieldset>
        );
      })}

      {result?.error ? (
        <div className="verdict fail">
          <span>{result.error}</span>
        </div>
      ) : result ? (
        <div className={`verdict ${result.passed ? "pass" : "fail"}`} role="status">
          <span>
            <b className="num">
              {result.results.filter((x) => x.correct).length} of {questions.length} right ({result.score}%).
            </b>{" "}
            {result.passed
              ? nextHref
                ? "Lesson passed, the next one is open."
                : "That was the last lesson. Well done."
              : `You need ${needed}. Watch the part you missed and try again.`}
          </span>
          {after(result.passed)}
        </div>
      ) : (
        <div className="verdict">
          <span className="num">
            {answered} of {questions.length} answered
          </span>
          <button type="button" className="btn" onClick={submit} disabled={busy || answered < questions.length}>
            {busy ? "Checking…" : "Check answers"}
          </button>
        </div>
      )}
    </section>
  );
}

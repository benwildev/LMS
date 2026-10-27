"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import Cover from "./Cover";
import Icon from "./Icon";

export type CardCourse = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  level: string;
  language: string;
  category: string;
  instructor: string;
  price: number;
  comparePrice: number;
  cover: string | null;
  lessons: number;
  minutes: number;
  questions: number;
  students: number;
};

const nf = new Intl.NumberFormat("en-IN");
const tk = (n: number) => `৳${nf.format(n)}`;
const dur = (m: number) => (!m ? "—" : m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60 ? `${m % 60} min` : ""}`.trim() : `${m} min`);
const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

const PAGE = 6;

function card(c: CardCourse) {
  return (
    <li key={c.id}>
      <Link href={`/courses/${c.slug}`} className="ed-card">
        <div className="ed-card-img">
          <Cover src={c.cover} title={c.title} />
        </div>
        <div className="ed-card-who">
          {c.instructor ? (
            <span className="ed-teacher">
              <span className="ed-av" style={{ ["--h" as string]: hue(c.instructor) }} aria-hidden="true">
                {initials(c.instructor)}
              </span>
              {c.instructor}
            </span>
          ) : (
            <span className="ed-teacher ed-teacher-muted">{c.language || c.level || "Video course"}</span>
          )}
          {(c.category || c.level) && <span className="ed-tag">{c.category || c.level}</span>}
        </div>
        <h3>{c.title}</h3>
        <div className="ed-card-meta">
          <span>
            <Icon name="clock" size={15} />
            {dur(c.minutes)}
          </span>
          <span>
            <Icon name="list" size={15} />
            {c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}
          </span>
          {c.students > 0 && (
            <span>
              <Icon name="students" size={15} />
              {c.students}
            </span>
          )}
        </div>
        <div className="ed-card-foot">
          <span className="ed-price">
            {c.price === 0 ? "Free" : tk(c.price)}
            {c.comparePrice > c.price && <s>{tk(c.comparePrice)}</s>}
          </span>
          <span className="ed-quiz">
            {c.questions > 0 ? (
              <>
                <Icon name="check" size={15} />
                {c.questions} quiz questions
              </>
            ) : (
              c.level
            )}
          </span>
        </div>
      </Link>
    </li>
  );
}


export default function CourseGrid({
  courses,
  title,
  initialQuery = "",
  initialTopic = "",
  popular = false,
}: {
  courses: CardCourse[];
  title?: React.ReactNode;
  initialQuery?: string;
  initialTopic?: string;
  /** Homepage mode: the most-enrolled courses, no filters, and a link to the full list. */
  popular?: boolean;
}) {
  // Filter by category when courses have them, otherwise by level.
  const byCategory = courses.some((c) => c.category);
  const groups = useMemo(
    () => Array.from(new Set(courses.map((c) => (byCategory ? c.category : c.level)).filter(Boolean))),
    [courses, byCategory]
  );
  const hasFree = courses.some((c) => c.price === 0);
  const chips = ["All courses", ...groups, ...(hasFree ? ["Free"] : [])];
  const [chip, setChip] = useState(chips.includes(initialTopic) ? initialTopic : "All courses");
  const [q, setQ] = useState(initialQuery);
  const [all, setAll] = useState(false);
  const strip = useRef<HTMLDivElement>(null);

  const shown = courses.filter(
    (c) =>
      (chip === "All courses" ||
        (chip === "Free" ? c.price === 0 : (byCategory ? c.category : c.level) === chip)) &&
      (!q ||
        `${c.title} ${c.subtitle} ${c.category} ${c.instructor} ${c.language}`.toLowerCase().includes(q.toLowerCase()))
  );
  const visible = popular
    ? [...courses].sort((a, b) => b.students - a.students || b.lessons - a.lessons).slice(0, PAGE)
    : all
      ? shown
      : shown.slice(0, PAGE);
  const scroll = (dir: number) => strip.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  if (popular) {
    return (
      <>
        {visible.length === 0 ? (
          <p className="ed-empty">The first courses are being recorded. Create an account and you’ll find them here when they open.</p>
        ) : (
          <ul className="ed-cards">{visible.map((c) => card(c))}</ul>
        )}
        <div className="ed-more">
          <Link href="/courses" className="ed-btn ed-btn-line">
            View all courses ({courses.length})
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ed-sec-head">
        <h2 className="ed-h2">{title}</h2>
        <label className="ed-search">
          <span className="sr-only">Search courses</span>
          <input type="search" placeholder="Search your course" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="ed-search-btn" aria-hidden="true">
            <Icon name="search" size={16} />
          </span>
        </label>
      </div>

      {chips.length > 1 && (
        <div className="ed-cats">
          <button type="button" className="ed-arrow" onClick={() => scroll(-1)} aria-label="Scroll categories left">
            <Icon name="back" size={16} />
          </button>
          <div className="ed-cat-strip" ref={strip} role="tablist" aria-label="Categories">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={chip === c}
                className={`ed-cat${chip === c ? " on" : ""}`}
                onClick={() => {
                  setChip(c);
                  setAll(false);
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <button type="button" className="ed-arrow" onClick={() => scroll(1)} aria-label="Scroll categories right">
            <Icon name="next" size={16} />
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="ed-empty">
          {courses.length === 0
            ? "The first courses are being recorded. Create an account and you’ll find them here when they open."
            : "No course matches that. Try another word or category."}
        </p>
      ) : (
        <ul className="ed-cards">
          {visible.map((c) => card(c))}
        </ul>
      )}

      {shown.length > PAGE && (
        <div className="ed-more">
          <button type="button" className="ed-btn ed-btn-line" onClick={() => setAll(!all)}>
            {all ? "Show fewer" : `Other courses (${shown.length - PAGE})`}
          </button>
        </div>
      )}
    </>
  );
}

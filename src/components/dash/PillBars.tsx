"use client";
import Link from "next/link";
import { useId, useState } from "react";

export type Series = { label: string; total: number }[];
export type Dataset = { key: string; name: string; data: Series };

const nf = new Intl.NumberFormat("en-IN");
function short(v: number, money: boolean) {
  const s = v >= 1000 ? `${+(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v);
  return money ? `৳${s}` : s;
}
/** A round top and step above the maximum; counts get whole-number steps. */
function scale(max: number, whole: boolean) {
  if (max <= 0) return { top: whole ? 4 : 5, step: 1 };
  if (whole && max <= 5) return { top: Math.max(max + 1, 4), step: 1 };
  const raw = max / 5;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  let step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  if (whole) step = Math.max(1, Math.round(step));
  return { top: Math.ceil((max * 1.05) / step) * step, step };
}

/** Card with pill-shaped bars; the busiest bar (or the hovered one) is highlighted with its value. */
export default function PillBars({
  title,
  icon,
  datasets,
  money = false,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  datasets: Dataset[];
  money?: boolean;
  href?: string;
}) {
  const [which, setWhich] = useState(datasets[0]!.key);
  const [hover, setHover] = useState<number | null>(null);
  const pid = useId().replace(/:/g, "");
  const ds = datasets.find((d) => d.key === which) ?? datasets[0]!;
  const data = ds.data;
  const max = Math.max(0, ...data.map((d) => d.total));
  const { top, step } = scale(max, !money);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const peak = max > 0 ? data.findIndex((d) => d.total === max) : -1;
  const active = hover ?? peak;

  const W = 560;
  const H = 320;
  const padL = 40;
  const padT = 34;
  const padB = 28;
  const plotH = H - padT - padB;
  const slot = (W - padL) / data.length;
  const bw = Math.min(56, slot * 0.66);
  const y = (v: number) => padT + plotH - (v / top) * plotH;

  return (
    <section className="d-card">
      <header className="d-head">
        <span className="d-icon">{icon}</span>
        <h2>{title}</h2>
        <div className="d-head-right">
          {datasets.length > 1 && (
            <div className="seg" role="tablist" aria-label="Period">
              {datasets.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={d.key === which}
                  className={d.key === which ? "on" : ""}
                  onClick={() => {
                    setWhich(d.key);
                    setHover(null);
                  }}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
          {href && (
            <Link href={href} className="d-arrow" aria-label={`Open ${title}`}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>
          )}
        </div>
      </header>
      <div className="d-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}, ${ds.name}`}>
          <defs>
            <pattern id={`h${pid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" className="bar-soft" />
              <line x1="0" y1="0" x2="0" y2="8" className="bar-hatch" strokeWidth="3" />
            </pattern>
            <pattern id={`a${pid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" className="bar-strong" />
              <line x1="0" y1="0" x2="0" y2="8" className="bar-hatch-strong" strokeWidth="3" />
            </pattern>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W} y1={y(t)} y2={y(t)} className="grid" />
              <text x={padL - 10} y={y(t) + 4} textAnchor="end" className="tick">
                {short(t, false)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = padL + slot * i + slot / 2;
            const h = Math.max(d.total > 0 ? bw : 0, (d.total / top) * plotH);
            const on = i === active;
            return (
              <g
                key={d.label + i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                className="bar-g"
              >
                <rect x={cx - slot / 2} y={padT} width={slot} height={plotH} fill="transparent" />
                {d.total > 0 ? (
                  <rect
                    x={cx - bw / 2}
                    y={padT + plotH - h}
                    width={bw}
                    height={h}
                    rx={bw / 2}
                    fill={`url(#${on ? "a" : "h"}${pid})`}
                  />
                ) : (
                  <rect x={cx - bw / 2} y={padT + plotH - 6} width={bw} height={6} rx={3} className="bar-zero" />
                )}
                <text x={cx} y={H - 6} textAnchor="middle" className="tick">
                  {d.label.toUpperCase()}
                </text>
                <title>
                  {d.label}: {money ? `৳${nf.format(d.total)}` : nf.format(d.total)}
                </title>
              </g>
            );
          })}
          {active >= 0 && data[active] && data[active]!.total > 0 && (() => {
            const d = data[active]!;
            const cx = padL + slot * active + slot / 2;
            const h = Math.max(bw, (d.total / top) * plotH);
            const ty = padT + plotH - h;
            const label = money ? `৳${nf.format(d.total)}` : `${nf.format(d.total)}`;
            const lw = Math.max(44, label.length * 7.4 + 18);
            return (
              <g className="tip" pointerEvents="none">
                <rect x={cx - lw / 2} y={ty - 34} width={lw} height={22} rx={11} />
                <text x={cx} y={ty - 19} textAnchor="middle">
                  {label}
                </text>
                <circle cx={cx} cy={ty + bw / 2 - 2} r={7} className="tip-dot" />
              </g>
            );
          })()}
        </svg>
      </div>
    </section>
  );
}

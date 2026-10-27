/** A smooth green area under a line. Points are drawn with Catmull-Rom curves through the real values. */
export default function AreaChart({ values, id = "area" }: { values: number[]; id?: string }) {
  const W = 320;
  const H = 120;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [
    values.length === 1 ? W / 2 : (i / (values.length - 1)) * W,
    H - 12 - (v / max) * (H - 30),
  ]);
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${Math.min(H - 2, c1[1])} ${c2[0]},${Math.min(H - 2, c2[1])} ${p2[0]},${p2[1]}`;
  }
  return (
    <svg className="area" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--g-500)" stopOpacity=".28" />
          <stop offset="1" stopColor="var(--g-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke="var(--g-600)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A half-circle gauge: the share done in green on a pale track. */
export default function Gauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 80;
  const len = Math.PI * r;
  return (
    <svg className="gauge" viewBox="0 0 200 112" aria-hidden="true">
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" className="gauge-track" strokeWidth="18" strokeLinecap="round" />
      <path
        d="M20 100 A80 80 0 0 1 180 100"
        fill="none"
        className="gauge-fill"
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray={`${(v / 100) * len} ${len}`}
      />
    </svg>
  );
}

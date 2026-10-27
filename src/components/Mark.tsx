/** The school's mark: an open book drawn as two pages meeting at a spine. */
export default function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 5.5c3.6-.9 6.8-.4 10 1.6v12.4c-3.2-2-6.4-2.5-10-1.6z" fill="currentColor" />
      <path d="M22 5.5c-3.6-.9-6.8-.4-10 1.6v12.4c3.2-2 6.4-2.5 10-1.6z" fill="currentColor" opacity=".55" />
    </svg>
  );
}

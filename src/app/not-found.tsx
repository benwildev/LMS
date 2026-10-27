import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page" style={{ paddingTop: 120 }}>
      <h1 className="page-title">This page isn’t here.</h1>
      <p className="lead" style={{ marginTop: 24 }}>
        The course may have been moved or unpublished.
      </p>
      <p style={{ marginTop: 32 }}>
        <Link className="btn" href="/">
          Back to the courses
        </Link>
      </p>
    </main>
  );
}

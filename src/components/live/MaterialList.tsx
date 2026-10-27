import type { Material } from "@/lib/data";
import { fileSize } from "@/lib/time";

const KIND: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "Image",
  "image/jpeg": "Image",
  "image/webp": "Image",
  "image/gif": "Image",
  "text/plain": "Text",
  "application/zip": "Zip",
};
export function materialKind(m: Material) {
  if (m.kind === "link") return "Link";
  if (KIND[m.mime_type]) return KIND[m.mime_type]!;
  if (/word/.test(m.mime_type)) return "Word";
  if (/presentation|powerpoint/.test(m.mime_type)) return "Slides";
  if (/sheet|excel/.test(m.mime_type)) return "Excel";
  return "File";
}

/** Materials for students. Every link goes through /api/materials/:id, which checks access. */
export default function MaterialList({ items, empty }: { items: Material[]; empty: string }) {
  if (!items.length) return <p className="empty">{empty}</p>;
  return (
    <ul className="mat-list">
      {items.map((m) => {
        const kind = materialKind(m);
        const opens = m.kind === "link" || kind === "PDF" || kind === "Image" || kind === "Text";
        return (
          <li key={m.id}>
            <span className={`mat-icon mat-${kind.toLowerCase()}`} aria-hidden="true">
              {kind === "Link" ? "↗" : kind.slice(0, 3).toUpperCase()}
            </span>
            <div className="mat-info">
              <b>{m.title}</b>
              <small>
                {kind}
                {m.size ? ` · ${fileSize(m.size)}` : ""}
                {m.lesson_title ? ` · ${m.lesson_title}` : " · whole course"}
              </small>
            </div>
            <div className="mat-actions">
              <a className="btn btn-sm" href={`/api/materials/${m.id}`} target="_blank" rel="noopener">
                {m.kind === "link" ? "Open link" : opens ? "Open" : "Download"}
              </a>
              {m.kind === "file" && opens && (
                <a className="mat-dl" href={`/api/materials/${m.id}?download`} aria-label={`Download ${m.title}`}>
                  Download
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

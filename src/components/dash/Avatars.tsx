import { initials } from "@/lib/format";

/** Overlapping initials in pale tints, with a +N bubble for the rest. */
export default function Avatars({ people, more }: { people: { id: number; name: string }[]; more: number }) {
  return (
    <div className="avs">
      {people.map((p) => (
        <span key={p.id} className="av" style={{ ["--h" as string]: (p.id * 137) % 360 }} title={p.name}>
          {initials(p.name)}
        </span>
      ))}
      {more > 0 && <span className="av av-more">+{more}</span>}
    </div>
  );
}

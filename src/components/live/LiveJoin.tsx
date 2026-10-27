"use client";
import { useEffect, useState } from "react";
import { liveState, until, JOIN_EARLY_MIN, type LiveState } from "@/lib/time";

/** The action for one class. Re-checks the clock every 30 s so "Join" opens without a reload. */
export default function LiveJoin({
  startsAt,
  durationMin,
  meetUrl,
  recordingUrl,
  calendarUrl,
  compact = false,
}: {
  startsAt: string;
  durationMin: number;
  meetUrl: string;
  recordingUrl: string;
  calendarUrl: string;
  compact?: boolean;
}) {
  const start = new Date(startsAt);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  // Until the browser's clock is read, render the server's view without the time-dependent bits.
  const state: LiveState = now === null ? "upcoming" : liveState(start, durationMin, now);

  if (state === "live" || state === "soon") {
    return (
      <div className="lj">
        {state === "live" && <span className="lj-live">Live now</span>}
        <a className="btn lj-join" href={meetUrl} target="_blank" rel="noopener noreferrer">
          Join class
        </a>
      </div>
    );
  }
  if (state === "ended") {
    return recordingUrl ? (
      <a className="btn btn-quiet lj-rec" href={recordingUrl} target="_blank" rel="noopener noreferrer">
        Watch recording
      </a>
    ) : (
      <span className="lj-note">Ended</span>
    );
  }
  return (
    <div className="lj">
      {!compact && (
        <a className="lj-cal" href={calendarUrl} target="_blank" rel="noopener noreferrer">
          Add to calendar
        </a>
      )}
      <span className="lj-note" title={`The Join button opens ${JOIN_EARLY_MIN} minutes before the start`}>
        {now === null ? "Upcoming" : `Starts ${until(start, now)}`}
      </span>
    </div>
  );
}

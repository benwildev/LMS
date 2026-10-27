"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { parseVideo } from "@/lib/video";

const OwnPlayer = dynamic(() => import("./OwnPlayer"), { ssr: false, loading: () => <div className="player" /> });

/**
 * Plays a lesson. Video files and HLS streams use our own player (no branding).
 * Embeds (YouTube, Drive, Vimeo, Bunny) show a poster first and only load when played.
 */
export default function VideoPlayer({
  url,
  title,
  poster,
  autoPlay = false,
}: {
  url: string;
  title: string;
  poster?: string | null;
  autoPlay?: boolean;
}) {
  const src = parseVideo(url);
  const [playing, setPlaying] = useState(autoPlay);
  const [posterOk, setPosterOk] = useState(true);

  if (!src) {
    return (
      <div className="player player-empty">
        <div>
          <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
            <path d="M4 5h16v11H4zM9 20h6M10 8.5v4l3.5-2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <p>This lesson’s video hasn’t been added yet.</p>
        </div>
      </div>
    );
  }

  if (src.ownPlayer) {
    return (
      <div className="player player-own">
        <OwnPlayer key={src.embedUrl} src={src.embedUrl} hls={src.kind === "hls"} title={title} poster={poster} autoPlay={autoPlay} />
      </div>
    );
  }

  const thumb = src.thumb ?? poster ?? null;
  return (
    <div className="player">
      {playing ? (
        <iframe
          src={src.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" className="player-poster" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
          {thumb && posterOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" onError={() => setPosterOk(false)} />
          ) : (
            <span className="player-title">{title}</span>
          )}
          <span className="player-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

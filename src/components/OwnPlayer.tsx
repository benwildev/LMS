"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const RATES = [0.75, 1, 1.25, 1.5, 2];

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

const P = {
  play: "M8 5.5v13l10.5-6.5z",
  pause: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  back: "M11 7 6 12l5 5M18 7l-5 5 5 5",
  fwd: "M13 7l5 5-5 5M6 7l5 5-5 5",
  vol: "M4 10h3l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11",
  mute: "M4 10h3l5-4v12l-5-4H4zM16 9l5 6M21 9l-5 6",
  full: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
  exit: "M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5",
};
const I = ({ d, size = 20, fill = false }: { d: string; size?: number; fill?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d={d}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Plays a video file (MP4/WebM) or an HLS stream (.m3u8) in our own player:
 * no third-party logo, title bar or suggested videos. Remembers where each student stopped.
 */
export default function OwnPlayer({
  src,
  hls,
  title,
  poster,
  autoPlay = false,
}: {
  src: string;
  hls: boolean;
  title: string;
  poster?: string | null;
  autoPlay?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const v = useRef<HTMLVideoElement>(null);
  const hideT = useRef<ReturnType<typeof setTimeout>>();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [buf, setBuf] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rateOpen, setRateOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [show, setShow] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const key = `tbu:pos:${src}`;
  const lastSave = useRef(0);
  const save = useCallback(
    (force = false) => {
      const el = v.current;
      if (!el || !el.duration) return;
      const now = Date.now();
      if (!force && now - lastSave.current < 3000) return;
      lastSave.current = now;
      try {
        localStorage.setItem(key, String(el.currentTime));
      } catch {
        /* storage off */
      }
    },
    [key]
  );
  // Save when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => save(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      save(true);
    };
  }, [save]);

  // Load the source: native for files (and HLS on Safari), hls.js elsewhere.
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    setError("");
    let destroy: (() => void) | undefined;
    if (hls && !el.canPlayType("application/vnd.apple.mpegurl")) {
      let cancelled = false;
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setError("This browser can’t play this video stream.");
          return;
        }
        const h = new Hls({ maxBufferLength: 30 });
        h.on(Hls.Events.ERROR, (_e, d) => {
          if (d.fatal) setError("The video stream couldn’t be loaded. Check your connection and try again.");
        });
        h.loadSource(src);
        h.attachMedia(el);
        destroy = () => h.destroy();
      });
      return () => {
        cancelled = true;
        destroy?.();
      };
    }
    el.src = src;
    return () => {
      el.removeAttribute("src");
      el.load();
    };
  }, [src, hls]);

  // Fullscreen state follows the browser.
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1400);
  };
  const poke = useCallback(() => {
    setShow(true);
    clearTimeout(hideT.current);
    hideT.current = setTimeout(() => {
      if (v.current && !v.current.paused) {
        setShow(false);
        setRateOpen(false);
      }
    }, 2600);
  }, []);

  const toggle = () => {
    const el = v.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => setError("Press play again to start the video."));
    else el.pause();
  };
  const seekBy = (s: number) => {
    const el = v.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + s), el.duration || 0);
    flash(s > 0 ? `+${s}s` : `${s}s`);
    poke();
  };
  const setSpeed = (r: number) => {
    if (v.current) v.current.playbackRate = r;
    setRate(r);
    setRateOpen(false);
    flash(`${r}×`);
  };
  const toggleMute = () => {
    const el = v.current;
    if (!el) return;
    el.muted = !el.muted;
    if (!el.muted && el.volume === 0) el.volume = 0.6;
  };
  const toggleFull = () => {
    const el = box.current;
    const vid = v.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => vid?.webkitEnterFullscreen?.());
    else vid?.webkitEnterFullscreen?.(); // iPhone
  };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") toggle();
    else if (k === "arrowright") seekBy(5);
    else if (k === "arrowleft") seekBy(-5);
    else if (k === "l") seekBy(10);
    else if (k === "j") seekBy(-10);
    else if (k === "f") toggleFull();
    else if (k === "m") toggleMute();
    else if (k === "arrowup" && v.current) v.current.volume = Math.min(1, v.current.volume + 0.1);
    else if (k === "arrowdown" && v.current) v.current.volume = Math.max(0, v.current.volume - 0.1);
    else return;
    e.preventDefault();
    poke();
  };

  const pct = dur ? (time / dur) * 100 : 0;
  const bufPct = dur ? (buf / dur) * 100 : 0;
  const controlsVisible = show || !playing;

  return (
    <div
      ref={box}
      className={`op${controlsVisible ? "" : " op-idle"}${full ? " op-full" : ""}`}
      tabIndex={0}
      role="region"
      aria-label={`Video player: ${title}`}
      onKeyDown={onKey}
      onMouseMove={poke}
      onMouseLeave={() => playing && setShow(false)}
      onTouchStart={poke}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={v}
        className="op-video"
        poster={poster ?? undefined}
        preload="metadata"
        playsInline
        autoPlay={autoPlay}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture={false}
        onClick={toggle}
        onDoubleClick={toggleFull}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setDur(el.duration);
          setReady(true);
          try {
            const saved = Number(localStorage.getItem(key));
            if (saved > 5 && saved < el.duration - 10) {
              el.currentTime = saved;
              setTime(saved);
              flash(`Resumed at ${fmt(saved)}`);
            }
          } catch {
            /* storage off: start from the beginning */
          }
        }}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          save();
        }}
        onSeeked={() => save(true)}
        onProgress={(e) => {
          const el = e.currentTarget;
          if (el.buffered.length) setBuf(el.buffered.end(el.buffered.length - 1));
        }}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          poke();
        }}
        onPause={() => {
          setPlaying(false);
          setShow(true);
          save(true);
        }}
        onEnded={() => {
          lastSave.current = Date.now() + 60_000; // don't re-save the end position
          try {
            localStorage.removeItem(key);
          } catch {
            /* ignore */
          }
        }}
        onVolumeChange={(e) => {
          setVol(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
        onError={() => setError("This video couldn’t be loaded. The link may be wrong or the file isn’t public.")}
      />

      {error ? (
        <div className="op-error" role="alert">
          {error}
        </div>
      ) : (
        !playing && (
          <button type="button" className="op-big" onClick={toggle} aria-label={started ? "Play" : `Play: ${title}`}>
            <I d={P.play} size={30} fill />
          </button>
        )
      )}
      {!started && !error && <div className="op-title">{title}</div>}
      {toast && <div className="op-toast">{toast}</div>}

      <div className="op-bar" onClick={(e) => e.stopPropagation()}>
        <div className="op-seek">
          <div className="op-track" aria-hidden="true">
            <i className="op-buf" style={{ width: `${bufPct}%` }} />
            <i className="op-done" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={time}
            disabled={!ready}
            aria-label="Seek"
            aria-valuetext={`${fmt(time)} of ${fmt(dur)}`}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (v.current) v.current.currentTime = t;
              setTime(t);
              poke();
            }}
          />
        </div>
        <div className="op-row">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            <I d={playing ? P.pause : P.play} fill />
          </button>
          <button type="button" onClick={() => seekBy(-10)} aria-label="Back 10 seconds" className="op-hide-xs">
            <I d={P.back} />
          </button>
          <button type="button" onClick={() => seekBy(10)} aria-label="Forward 10 seconds" className="op-hide-xs">
            <I d={P.fwd} />
          </button>
          <div className="op-vol">
            <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
              <I d={muted || vol === 0 ? P.mute : P.vol} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : vol}
              aria-label="Volume"
              onChange={(e) => {
                if (!v.current) return;
                v.current.volume = Number(e.target.value);
                v.current.muted = Number(e.target.value) === 0;
              }}
            />
          </div>
          <span className="op-time">
            {fmt(time)} / {fmt(dur)}
          </span>
          <div className="op-spacer" />
          <div className="op-rate">
            <button type="button" onClick={() => setRateOpen(!rateOpen)} aria-haspopup="menu" aria-expanded={rateOpen}>
              {rate}×
            </button>
            {rateOpen && (
              <div className="op-menu" role="menu">
                {RATES.map((r) => (
                  <button key={r} type="button" role="menuitemradio" aria-checked={r === rate} onClick={() => setSpeed(r)}>
                    {r === 1 ? "Normal" : `${r}×`}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"}>
            <I d={full ? P.exit : P.full} />
          </button>
        </div>
      </div>
    </div>
  );
}

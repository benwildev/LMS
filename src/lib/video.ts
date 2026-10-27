export type VideoKind = "youtube" | "drive" | "vimeo" | "bunny" | "file" | "hls";

export type VideoSource = {
  kind: VideoKind;
  /** For embeds: the iframe URL. For file/hls: the media URL our own player loads. */
  embedUrl: string;
  thumb: string | null;
  /** True when the video plays in our own player, with no third-party branding. */
  ownPlayer: boolean;
  label: string;
};

const YT =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const DRIVE = /drive\.google\.com\/(?:file\/d\/|open\?(?:[^#]*&)?id=|uc\?(?:[^#]*&)?id=)([A-Za-z0-9_-]{20,})/;
const VIMEO = /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d{6,})(?:\/([0-9a-f]{6,}))?(?:\?[^#]*?\bh=([0-9a-f]{6,}))?/i;
const BUNNY = /(?:iframe|player)\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([0-9a-f-]{36})/i;
const HLS = /^https?:\/\/[^\s]+\.m3u8(?:[?#][^\s]*)?$/i;
const FILE = /^https?:\/\/[^\s]+\.(?:mp4|m4v|webm|mov|ogv)(?:[?#][^\s]*)?$/i;

/**
 * Turns a lesson's video link into something we can play.
 * Direct files and HLS streams play in our own player (no branding);
 * YouTube, Google Drive, Vimeo and Bunny Stream play in their embed.
 */
export function parseVideo(raw?: string | null): VideoSource | null {
  const url = (raw || "").trim();
  if (!url) return null;

  if (HLS.test(url)) return { kind: "hls", embedUrl: url, thumb: null, ownPlayer: true, label: "HLS stream" };
  if (FILE.test(url)) return { kind: "file", embedUrl: url, thumb: null, ownPlayer: true, label: "Video file" };

  const bunny = url.match(BUNNY);
  if (bunny) {
    const [, lib, id] = bunny;
    return {
      kind: "bunny",
      embedUrl: `https://iframe.mediadelivery.net/embed/${lib}/${id}?autoplay=true&preload=true&responsive=true`,
      thumb: null,
      ownPlayer: false,
      label: "Bunny Stream",
    };
  }

  const vimeo = url.match(VIMEO);
  if (vimeo) {
    const [, id, pathHash, queryHash] = vimeo;
    const h = pathHash || queryHash;
    const q = new URLSearchParams({ title: "0", byline: "0", portrait: "0", badge: "0", dnt: "1", autoplay: "1" });
    if (h) q.set("h", h);
    return {
      kind: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}?${q}`,
      thumb: null,
      ownPlayer: false,
      label: "Vimeo",
    };
  }

  const yt = url.match(YT) || (/^[A-Za-z0-9_-]{11}$/.test(url) ? [url, url] : null);
  if (yt) {
    const id = yt[1];
    // rel=0: suggestions only from the same channel; iv_load_policy=3: no annotations.
    // YouTube's own logo and title stay: its terms don't allow hiding them.
    const q = new URLSearchParams({ rel: "0", iv_load_policy: "3", playsinline: "1", color: "white", autoplay: "1" });
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${q}`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      ownPlayer: false,
      label: "YouTube",
    };
  }

  const dr = url.match(DRIVE);
  if (dr) {
    return {
      kind: "drive",
      embedUrl: `https://drive.google.com/file/d/${dr[1]}/preview`,
      thumb: null,
      ownPlayer: false,
      label: "Google Drive",
    };
  }
  return null;
}

export function coverFor(course: { thumbnail_url: string; preview_url: string }, firstLessonUrl?: string) {
  if (course.thumbnail_url) return course.thumbnail_url;
  return parseVideo(course.preview_url)?.thumb || parseVideo(firstLessonUrl)?.thumb || null;
}

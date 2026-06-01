/**
 * Multi-media ads (Marketing API): `POST /act_<AD_ACCOUNT_ID>/ads` with `creative` + `media_sourcing_spec`.
 * @see https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/multi-media-ads
 *
 * Not wired into the Kraken wizard yet — use this module as the single place to extend when supporting
 * multiple images/videos in one ad.
 */

export type MultiMediaSourceEntry = {
  hash?: string;
  video_id?: string;
  source: "multi_media";
  opt_in_status: "opt_in";
};

export type MultiMediaAdPostBody = {
  name: string;
  adset_id: string;
  status: "ACTIVE" | "PAUSED";
  creative: string;
  media_sourcing_spec: { images?: MultiMediaSourceEntry[]; videos?: MultiMediaSourceEntry[] };
};

/**
 * Serialises `creative` and `media_sourcing_spec` the way curl `-F` form encoding expects
 * (JSON strings for nested objects). `graphJsonPost` in this codebase sends JSON bodies — pass the
 * same structure with `creative` as a parsed object if your Graph client JSON-encodes nested fields.
 */
export function buildMultiMediaAdPostBodyJson(options: {
  name: string;
  adsetId: string;
  status: "ACTIVE" | "PAUSED";
  /** `object_story_spec` JSON string or object per Meta examples */
  creative: Record<string, unknown> | string;
  mediaEntries: MultiMediaSourceEntry[];
}): Record<string, unknown> {
  const creative =
    typeof options.creative === "string" ? options.creative : JSON.stringify(options.creative);
  const images = options.mediaEntries.filter((e) => e.hash);
  const videos = options.mediaEntries.filter((e) => e.video_id);
  const media_sourcing_spec: Record<string, unknown> = {};
  if (images.length > 0) media_sourcing_spec.images = images;
  if (videos.length > 0) media_sourcing_spec.videos = videos;
  return {
    name: options.name.slice(0, 256),
    adset_id: options.adsetId,
    status: options.status,
    creative,
    media_sourcing_spec,
  };
}

export function multiMediaImageEntry(imageHash: string): MultiMediaSourceEntry {
  return { hash: imageHash, source: "multi_media", opt_in_status: "opt_in" };
}

export function multiMediaVideoEntry(videoId: string): MultiMediaSourceEntry {
  return { video_id: videoId, source: "multi_media", opt_in_status: "opt_in" };
}

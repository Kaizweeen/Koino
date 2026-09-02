import { BIBLE_VERSIONS, DEFAULT_VERSION_ID, type BibleVersion } from "@/lib/bible/books";

/**
 * The translation a reader gets before they choose one.
 *
 * Every version Koino ships is public domain, which is what lets the text live inside the app
 * rather than behind a licensed API — see scripts/build-bible.mjs, which is also where a new one
 * is added.
 */
export const DEFAULT_VERSION: BibleVersion =
  BIBLE_VERSIONS.find((v) => v.id === DEFAULT_VERSION_ID) ?? BIBLE_VERSIONS[0];

/** Whether a stored or linked value names a translation that actually ships. */
export function isVersionId(id: unknown): id is string {
  return typeof id === "string" && BIBLE_VERSIONS.some((v) => v.id === id);
}

/**
 * The translation with this id, falling back to the default.
 *
 * Never throws: the id can come from `localStorage` written by an older build, so an unknown one
 * should quietly read in the default translation rather than leave someone without a Bible.
 */
export function getVersion(id: string | null | undefined): BibleVersion {
  return BIBLE_VERSIONS.find((v) => v.id === id) ?? DEFAULT_VERSION;
}

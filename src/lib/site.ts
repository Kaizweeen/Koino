/**
 * The canonical origin, used for metadataBase, robots, and the sitemap.
 *
 * Set NEXT_PUBLIC_SITE_URL in the deploy environment. Without it the app still builds and runs,
 * but absolute URLs point at localhost, so link previews and the sitemap would be wrong in
 * production — hence the build-time check below.
 */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Only the public marketing landing is listed. The hub under `/app` is a personal practice space
 * that robots.ts disallows, so listing it here would contradict that.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl()}/`, changeFrequency: "monthly", priority: 1 }];
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * The marketing landing at `/` is what should be indexed. Everything under `/app` is a personal,
 * signed-out-by-design practice space with no content worth a search result, so it is kept out of
 * the index rather than competing with the landing page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/app" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

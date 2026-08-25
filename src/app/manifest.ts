import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Koino — Daily SOAP Devotion",
    short_name: "Koino",
    description:
      "A calm daily devotion: read the Scripture, then write your Observation, Application, and Prayer.",
    id: "/app",
    start_url: "/app",
    // Confines the installed app to the app itself: the marketing page at / is not part of it, so
    // a stray link there opens in the browser rather than inside the installed window.
    scope: "/app",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBFAF7",
    theme_color: "#FBFAF7",
    categories: ["lifestyle", "books", "health"],
    // Android's installer requires a raster icon of at least 192px and ignores SVG entirely, so the
    // PNGs are what actually make the app installable; the SVG stays as the scalable "any" entry.
    icons: [
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

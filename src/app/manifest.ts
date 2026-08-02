import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Koino — Daily SOAP Devotion",
    short_name: "Koino",
    description:
      "A calm daily devotion: read the Scripture, then write your Observation, Application, and Prayer, set to music that matches the day.",
    start_url: "/app",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBFAF7",
    theme_color: "#FBFAF7",
    categories: ["lifestyle", "books", "health"],
    icons: [
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

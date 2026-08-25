import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import { APPLE_LAUNCH_IMAGES } from "@/app/appleLaunchImages";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Koino",
  title: { default: "Koino — Daily SOAP Devotion", template: "%s · Koino" },
  description:
    "A calm daily devotion. Read the Scripture, then write your Observation, Application, and Prayer.",
  appleWebApp: { capable: true, title: "Koino", statusBarStyle: "default" },
  openGraph: {
    title: "Koino — Daily SOAP Devotion",
    description: "Read the Scripture, then write your Observation, Application, and Prayer.",
    siteName: "Koino",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Koino — a calm daily devotion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koino — Daily SOAP Devotion",
    description: "Read the Scripture, then write your Observation, Application, and Prayer.",
    images: ["/opengraph-image.png"],
  },
  // iOS only accepts a raster apple-touch-icon; an SVG here leaves a blank home-screen tile.
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#151311" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies the saved theme + text size before first paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var p=JSON.parse(localStorage.getItem('koino.prefs.v1')||'{}');var d=p.theme==='dark'||((!p.theme||p.theme==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.dataset.theme=d?'dark':'light';e.dataset.text=p.textSize==='large'?'large':'regular';}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-text="regular" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {APPLE_LAUNCH_IMAGES.map(({ media, href }) => (
          <link key={href} rel="apple-touch-startup-image" media={media} href={href} />
        ))}
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}

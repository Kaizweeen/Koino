import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "Koino",
  title: { default: "Koino — Daily SOAP Devotion", template: "%s · Koino" },
  description:
    "A calm daily devotion. Read the Scripture, then write your Observation, Application, and Prayer, set to music that matches the day.",
  appleWebApp: { capable: true, title: "Koino", statusBarStyle: "default" },
  openGraph: {
    title: "Koino — Daily SOAP Devotion",
    description: "Read the Scripture, then write your Observation, Application, and Prayer.",
    siteName: "Koino",
    type: "website",
  },
  icons: { apple: "/icon-maskable.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

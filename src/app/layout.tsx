import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Koino — a daily guided devotion",
  description: "One verse, a short reflection, a guided prayer — set to music that matches the day.",
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
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

import { Suspense } from "react";
import type { Metadata } from "next";
import { BibleReader } from "@/components/bible/BibleReader";

export const metadata: Metadata = {
  title: "Bible",
  description: "Read the World English Bible — the whole text, offline and ad-free.",
};

export default function BiblePage() {
  // useSearchParams needs a Suspense boundary to prerender, and the reader reads its position
  // from the query string.
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <BibleReader />
    </Suspense>
  );
}

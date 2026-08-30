import { Suspense } from "react";
import type { Metadata } from "next";
import { VerseSoap } from "@/components/VerseSoap";

export const metadata: Metadata = {
  title: "Reflect on a verse",
  description: "Choose any passage and sit with it — Scripture, Observation, Application, Prayer.",
};

export default function SoapPage() {
  // useSearchParams needs a Suspense boundary to prerender, and which verse to sit with lives in
  // the query string.
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <VerseSoap />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Landing } from "@/components/Landing";

export const metadata: Metadata = {
  title: { absolute: "Koino — A calm daily devotion, built on the SOAP path" },
  description:
    "Read one verse, then write what you observe, how it applies, and a prayer. A short, finishable daily devotion that meets you in the mood you arrive in, set to music that matches the day.",
};

export default function LandingPage() {
  return <Landing />;
}

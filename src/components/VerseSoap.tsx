"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { referenceFromQuery } from "@/lib/bible/refs";
import { isMoodSlug, type MoodSlug } from "@/lib/themes";
import { VersePicker } from "@/components/VersePicker";
import { VerseSoapFlow } from "@/components/VerseSoapFlow";

/**
 * `/app/soap` — SOAP on a verse of the reader's choosing.
 *
 * Which verse lives in the query string (?b=PSA&c=46&v=10&m=peace), the same shape the Bible
 * reader keeps its position in. That is what lets the reader hand a tapped verse straight to this
 * flow, and it means a reflection in progress survives a reload with its passage intact. Without a
 * verse the route is the picker instead.
 */
export function VerseSoap() {
  const params = useSearchParams();

  const reference = useMemo(
    () => referenceFromQuery(params.get("b"), params.get("c"), params.get("v")),
    [params],
  );

  if (!reference) return <VersePicker />;

  const raw = params.get("m");
  const mood: MoodSlug = isMoodSlug(raw) ? raw : "open";

  return <VerseSoapFlow reference={reference} mood={mood} />;
}

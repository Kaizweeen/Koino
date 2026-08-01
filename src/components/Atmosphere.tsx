/**
 * Atmosphere — the day's theme rendered as soft, drifting light.
 * Sits behind content (z-0); wrap real content in a `relative z-10` layer.
 * `accent` flows in as the CSS var everything else keys off of.
 */
export function Atmosphere({
  accent,
  tone = "day",
  className = "",
}: {
  accent: string;
  tone?: "day" | "night";
  className?: string;
}) {
  return (
    <div
      className={`koino-atmo ${className}`}
      data-tone={tone}
      style={{ ["--accent" as string]: accent }}
      aria-hidden="true"
    />
  );
}

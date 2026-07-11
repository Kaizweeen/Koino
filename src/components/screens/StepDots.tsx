export function StepDots({ current, accent }: { current: 1 | 2 | 3; accent: string }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Step ${current} of 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className="h-[3px] w-4 rounded-full" style={{ background: n <= current ? accent : "#EAE8E0" }} />
      ))}
    </span>
  );
}

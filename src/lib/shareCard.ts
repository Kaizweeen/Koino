export interface CardOptions {
  verseText: string;
  verseRef: string;
  themeName: string;
  accent: string;
  accentSoft: string;
  note?: string;
}

/** Greedy word-wrap into lines of at most `maxChars` characters. */
export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line === "") line = w;
    else if (`${line} ${w}`.length <= maxChars) line += ` ${w}`;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** A download-safe filename for a verse card, e.g. "koino-psalm-46-10.png". */
export function shareFilename(verseRef: string): string {
  const slug = verseRef
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `koino-${slug || "verse"}.png`;
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] as string);
}

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const INK = "#2C2C2A";
const MUTED = "#6F6E68";

/** Build the shareable verse card as a self-contained 1080×1350 SVG string. */
export function buildCardSvg(opts: CardOptions): string {
  const { verseText, verseRef, themeName, accent, accentSoft, note } = opts;
  const W = 1080;
  const H = 1350;
  const cx = W / 2;

  const verseLines = wrapText(verseText, 20);
  const lineHeight = 92;
  const verseBlock = (verseLines.length - 1) * lineHeight;
  const verseTop = 600 - verseBlock / 2;
  const verseTspans = verseLines
    .map((line, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const refY = verseTop + verseBlock + 110;
  const dividerY = refY + 52;

  const pillW = themeName.length * 26 + 96;
  const pillX = cx - pillW / 2;

  let noteSvg = "";
  if (note && note.trim() !== "") {
    const noteLines = wrapText(note.trim(), 42).slice(0, 3);
    noteSvg = noteLines
      .map(
        (line, i) =>
          `<text x="${cx}" y="${dividerY + 66 + i * 46}" text-anchor="middle" font-family="${SERIF}" font-size="30" font-style="italic" fill="${MUTED}">${escapeXml(line)}</text>`,
      )
      .join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#FBFAF7"/>
<rect width="${W}" height="14" fill="${accent}"/>
<rect x="${pillX}" y="120" width="${pillW}" height="70" rx="35" fill="${accentSoft}"/>
<text x="${cx}" y="166" text-anchor="middle" font-family="${SANS}" font-size="30" font-weight="500" fill="${accent}">${escapeXml(themeName)}</text>
<text x="${cx}" y="${verseTop}" text-anchor="middle" font-family="${SERIF}" font-size="66" fill="${INK}">${verseTspans}</text>
<text x="${cx}" y="${refY}" text-anchor="middle" font-family="${SANS}" font-size="28" letter-spacing="8" fill="${accent}">${escapeXml(verseRef.toUpperCase())}</text>
<line x1="${cx - 30}" y1="${dividerY}" x2="${cx + 30}" y2="${dividerY}" stroke="${accent}" stroke-width="3"/>
${noteSvg}
<text x="${cx}" y="1252" text-anchor="middle" font-family="${SERIF}" font-size="46" fill="${INK}">Koino</text>
<text x="${cx}" y="1292" text-anchor="middle" font-family="${SANS}" font-size="22" letter-spacing="4" fill="${MUTED}">A DAILY GUIDED DEVOTION</text>
</svg>`;
}

/** Rasterise an SVG string to a PNG blob (browser only; rejects if canvas is unavailable). */
export function svgToPngBlob(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("export failed"))), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("render failed"));
    };
    img.src = url;
  });
}

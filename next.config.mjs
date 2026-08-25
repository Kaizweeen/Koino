/**
 * Content Security Policy.
 *
 * Koino loads no third-party scripts and makes no outbound requests at runtime, so the policy can
 * be tight. The two allowances that are not `'self'`:
 *   - 'unsafe-inline' on script-src: the inline theme script in the root layout has to run before
 *     first paint to avoid a flash of the wrong theme, and Next's own bootstrap is inline too.
 *   - fonts.googleapis.com / fonts.gstatic.com: next/font/google self-hosts the font files at
 *     build time, but keeping these listed means a font served from Google (should the build
 *     fall back to it) is not silently blocked.
 * 'unsafe-inline' on style-src is required by Tailwind's arbitrary inline styles and the many
 * theme-colour style props the UI sets per devotion.
 */
// React Refresh and the webpack HMR client evaluate strings, so `next dev` cannot run under the
// production policy. This allowance is scoped to development and never reaches a deployed build.
const devScript = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devScript}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Verse cards are built as inline SVG and rasterised through a blob/data URL before sharing.
  "img-src 'self' data: blob:",
  // Dev additionally needs the HMR websocket back to the local server.
  `connect-src 'self'${process.env.NODE_ENV === "production" ? "" : " ws:"}`,
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // The app asks for no device permissions; denying them outright keeps that true.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

/**
 * Static export mode (`npm run build:native`) emits a plain folder of files into out/ for the
 * Capacitor iOS shell to bundle. It is a separate mode rather than the default because a static
 * export has no server to send response headers: `headers()` is silently ignored there, so the
 * security headers below would vanish from the web deploy. Inside the native shell that costs
 * nothing — the WebView loads local files, with no origin to protect — but on the web those
 * headers have to keep coming from a real server, which is what the default build targets.
 */
const isStaticExport = process.env.NEXT_OUTPUT === "export";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  ...(isStaticExport
    ? {
        output: "export",
        // No image optimiser exists without a server.
        images: { unoptimized: true },
        // Emits out/app/today/index.html rather than out/app/today.html, which is what Capacitor's
        // local file server resolves for a nested route.
        trailingSlash: true,
      }
    : {
        async headers() {
          return [
            { source: "/:path*", headers: securityHeaders },
            // The worker must not be cached, or a stale one keeps serving an old app after a deploy.
            { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
          ];
        },
      }),
};

export default nextConfig;

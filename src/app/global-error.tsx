"use client";

// Last-resort boundary for errors thrown in the root layout itself. It replaces <html>, so it
// cannot rely on globals.css or the icon font — everything here is inline and self-contained.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EEEBE3",
          color: "#262521",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "22rem" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", margin: 0 }}>Something went wrong.</h1>
          <p style={{ color: "#55544D", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Please reload the page. Your saved devotions are safe on this device.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              background: "#0F6E56",
              color: "#FFFFFF",
              border: 0,
              borderRadius: 9999,
              padding: "0.75rem 1.5rem",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

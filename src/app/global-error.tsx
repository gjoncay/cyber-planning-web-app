"use client";

// Root-level error boundary: replaces the whole document, so it must render
// its own <html>/<body> and cannot rely on globals.css having loaded.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global error:", error);
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5efe6",
          color: "#1d1f1d",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            borderRadius: "12px",
            border: "1px solid #e4dbcd",
            background: "#fffdf9",
            maxWidth: "440px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "17px", letterSpacing: "-0.02em" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "13px", color: "#55605a", lineHeight: 1.6 }}>
            The application hit an unexpected error. Your saved plan data is untouched.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 18px",
              borderRadius: "6px",
              border: "none",
              background: "#58855f",
              color: "#fffdf9",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}

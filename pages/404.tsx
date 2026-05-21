/**
 * Minimal Pages Router 404 — zero imports beyond React's implicit JSX.
 *
 * Stripped to the absolute minimum so no chunk graph cross-contamination
 * can pull in the Drei <Html>-bearing chunks.
 */
export default function NotFound() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "0 1.5rem",
        textAlign: "center",
        background: "#f7f5f0",
        color: "#3a3632",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "72px", fontWeight: 400, fontStyle: "italic" }}>Memory not found.</h1>
      <p style={{ marginTop: "1.5rem", color: "#666" }}>That page drifted out of memory.</p>
      <a
        href="/"
        style={{
          display: "inline-block",
          marginTop: "2rem",
          background: "#3a3632",
          color: "#f7f5f0",
          padding: "1rem 2rem",
          borderRadius: "9999px",
          textDecoration: "none",
        }}
      >
        Back to start
      </a>
    </main>
  );
}

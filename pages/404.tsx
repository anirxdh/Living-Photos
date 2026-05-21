import Head from "next/head";
import Link from "next/link";

/**
 * Pages Router 404 — overrides Next.js's auto-generated /404 fallback that
 * was choking on Drei's internal <Html> being bundled into server chunks.
 *
 * Even though this project uses App Router exclusively (app/not-found.tsx),
 * Next.js still emits a Pages-Router /404 page during prerender. Without this
 * file, that fallback inherits chunks from anywhere and the static analyzer
 * triggers "<Html> should not be imported outside of pages/_document".
 *
 * This file is a pure Pages Router component using next/head (NOT next/document).
 * It satisfies the prerender check and never imports next/document.
 */
export default function NotFoundPagesRouter() {
  return (
    <>
      <Head>
        <title>Memory not found — Living Photos</title>
        <meta name="robots" content="noindex" />
      </Head>
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
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: "#999",
          }}
        >
          Lost in the archive
        </p>
        <h1
          style={{
            marginTop: "1.5rem",
            fontSize: "clamp(48px, 7vw, 96px)",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: 400,
            lineHeight: 1.02,
          }}
        >
          Memory not <span style={{ fontStyle: "italic", color: "#b8845c" }}>found.</span>
        </h1>
        <p
          style={{
            marginTop: "1.5rem",
            maxWidth: "28rem",
            color: "#666",
          }}
        >
          The page you're looking for has either drifted out of memory or never existed in the first
          place.
        </p>
        <div style={{ marginTop: "3rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#3a3632",
              color: "#f7f5f0",
              padding: "1rem 2rem",
              borderRadius: "9999px",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Back to start
          </Link>
        </div>
      </main>
    </>
  );
}

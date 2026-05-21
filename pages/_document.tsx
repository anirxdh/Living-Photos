/**
 * Custom Pages Router _document.
 *
 * Next.js's auto-generated default _document imports <Html> from next/document
 * (legitimately, since this is the ONE place that's allowed). But when Netlify's
 * @netlify/plugin-nextjs processes the build, the default _document gets
 * bundled into a chunk that the static analyzer then flags incorrectly.
 *
 * Providing this explicit file ensures Next.js uses OUR _document — minimal
 * and self-contained — instead of the auto-generated one.
 */
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

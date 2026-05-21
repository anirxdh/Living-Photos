/**
 * Custom Pages Router _app.
 *
 * Even though this project uses App Router exclusively, Next.js still uses
 * Pages Router for the auto-generated /404 fallback. Providing an explicit
 * _app.tsx prevents the default Next.js _app from being bundled (which can
 * pull in chunks that trigger the static analyzer).
 *
 * Minimal: just renders the page component. The pages/404.tsx component
 * brings its own styles inline so no shared CSS chain.
 */
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

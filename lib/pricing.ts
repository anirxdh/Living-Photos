/**
 * Single source of truth for the per-memory price.
 *
 * Change `PRICE_CENTS` here (or override via the env var below) and every
 * surface in the app updates together: Stripe Checkout amount, mock-fulfill
 * webhook payload, pricing card, CTA copy, scene unlock button, press page.
 *
 * Env override: set NEXT_PUBLIC_PRICE_CENTS in .env.local to change the price
 * without editing code. Defaults to 1500 (= $15). Must be set as the public
 * variant so the client bundles can read it for display strings.
 */

const DEFAULT_CENTS = 1500;

function parseCents(): number {
  const raw = process.env.NEXT_PUBLIC_PRICE_CENTS;
  if (!raw) return DEFAULT_CENTS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_CENTS;
  return n;
}

/** The price in cents (what Stripe expects). */
export const PRICE_CENTS = parseCents();

/** The price as a whole-dollar number (e.g. 15). */
export const PRICE_USD = Math.round(PRICE_CENTS / 100);

/** Display string used everywhere in the UI: `$15`. */
export const PRICE_DISPLAY = `$${PRICE_USD}`;

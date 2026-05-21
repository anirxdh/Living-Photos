"use client";

import { useEffect } from "react";

/**
 * On return from Stripe Checkout, mark the scene as paid:
 *
 *  1. Try /api/stripe/mock-fulfill — works when MOCK_MODE=true (the
 *     fully-mocked demo flow used by `pnpm seed` and Playwright tests).
 *  2. If that 400s (real Stripe mode, no MOCK_MODE), fall back to
 *     /api/debug/demo-fulfill — dev-only unlock so the video-recording
 *     flow works without `stripe listen` forwarding webhooks to localhost.
 *
 * Production never reaches either path: the real Stripe webhook fulfills
 * the order server-side and demo-fulfill refuses in production.
 */
export default function SuccessFulfill({
  sceneId,
  sessionId,
}: {
  sceneId: string;
  sessionId: string;
}) {
  useEffect(() => {
    if (!sceneId) return;

    async function fulfill() {
      // First try the mock-mode endpoint
      if (sessionId) {
        const mockRes = await fetch("/api/stripe/mock-fulfill", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sceneId, sessionId }),
        }).catch(() => null);
        if (mockRes?.ok) return; // mock fulfilled, we're done
      }

      // Fallback: dev demo-unlock (works without MOCK_MODE)
      await fetch("/api/debug/demo-fulfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sceneId }),
      }).catch(() => {
        // non-fatal; in production the real webhook handles this
      });
    }

    fulfill();
  }, [sceneId, sessionId]);

  return null;
}

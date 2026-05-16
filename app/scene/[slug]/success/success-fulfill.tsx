"use client";

import { useEffect } from "react";

/** Mock-mode helper: when the user returns from Stripe Checkout, ping the
 * mock-fulfill endpoint so the scene is marked paid. In production the real
 * Stripe webhook would handle this server-side independently. */
export default function SuccessFulfill({
  sceneId,
  sessionId,
}: {
  sceneId: string;
  sessionId: string;
}) {
  useEffect(() => {
    if (!sceneId || !sessionId) return;
    fetch("/api/stripe/mock-fulfill", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sceneId, sessionId }),
    }).catch(() => {
      // non-fatal; real webhook will catch up
    });
  }, [sceneId, sessionId]);
  return null;
}

/**
 * World Labs Marble adapter.
 * Mock returns a fixture .spz URL deterministically derived from sceneId.
 * Real wraps fetch() against the World Labs API (TODO: vendor SDK when stable).
 */

import { mockId } from "@/lib/utils";
import type { MarbleAdapter, MarbleResult, MarbleSubmitInput, MarbleSubmitOutput } from "./types";

const FIXTURE_SPZ = "/fixtures/living-room.spz";
const FIXTURE_SPZ_LOWPOLY = "/fixtures/living-room.lowpoly.spz";

const MOCK_LATENCY_MS = process.env.NODE_ENV === "test" ? 1 : 20;
const MARBLE_COST_CENTS = 120; // $1.20 per world

export class MockMarbleAdapter implements MarbleAdapter {
  private results = new Map<string, MarbleResult>();

  async submit(input: MarbleSubmitInput): Promise<MarbleSubmitOutput> {
    const jobId = mockId("marble_job", input.sceneId);
    this.results.set(jobId, {
      jobId,
      status: "succeeded",
      spzUrl: FIXTURE_SPZ,
      spzUrlLowPoly: FIXTURE_SPZ_LOWPOLY,
      costCents: MARBLE_COST_CENTS,
    });
    await sleep(MOCK_LATENCY_MS);
    return { jobId, estimatedReadyAt: new Date(Date.now() + 1000).toISOString() };
  }

  async poll(jobId: string): Promise<MarbleResult> {
    await sleep(MOCK_LATENCY_MS);
    return (
      this.results.get(jobId) ?? {
        jobId,
        status: "failed",
        costCents: 0,
        error: "Mock: unknown jobId",
      }
    );
  }
}

export class RealMarbleAdapter implements MarbleAdapter {
  constructor(private apiKey: string) {
    if (!apiKey) throw new Error("RealMarbleAdapter: WORLD_LABS_API_KEY missing");
  }

  async submit(input: MarbleSubmitInput): Promise<MarbleSubmitOutput> {
    const res = await fetch("https://api.worldlabs.ai/v1/marble/submit", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        image_url: input.imageUrl,
        client_reference_id: input.sceneId,
        webhook_url: input.webhookUrl,
      }),
    });
    if (!res.ok) throw new Error(`Marble submit failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { job_id: string; eta?: string };
    return {
      jobId: json.job_id,
      estimatedReadyAt: json.eta ?? new Date(Date.now() + 4 * 60_000).toISOString(),
    };
  }

  async poll(jobId: string): Promise<MarbleResult> {
    const res = await fetch(`https://api.worldlabs.ai/v1/marble/jobs/${jobId}`, {
      headers: { authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`Marble poll failed: ${res.status}`);
    const json = (await res.json()) as {
      status: "pending" | "succeeded" | "failed";
      spz_url?: string;
      spz_url_lowpoly?: string;
      error?: string;
    };
    return {
      jobId,
      status: json.status,
      spzUrl: json.spz_url,
      spzUrlLowPoly: json.spz_url_lowpoly,
      costCents: MARBLE_COST_CENTS,
      error: json.error,
    };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * World Labs Marble adapter.
 *
 * Mock returns a deterministic fixture URL.
 * Real delegates to `lib/image-blaster/marble.ts` which speaks the live API.
 */
import {
  extractMarbleOperationId,
  pickSpzUrls,
  pollMarbleOperation,
  submitMarbleWorld,
} from "@/lib/image-blaster/marble";
import { mockId } from "@/lib/utils";
import type { MarbleAdapter, MarbleResult, MarbleSubmitInput, MarbleSubmitOutput } from "./types";

const FIXTURE_SPZ = "/fixtures/living-room.spz";
const FIXTURE_SPZ_LOWPOLY = "/fixtures/living-room.lowpoly.spz";

const MOCK_LATENCY_MS = process.env.NODE_ENV === "test" ? 1 : 20;
const MARBLE_COST_CENTS = 120; // $1.20 per world per World Labs pricing

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

/**
 * Real Marble adapter. Submits a world generation, returns the operation id,
 * then polls until done. Splat URLs (full + low-poly) are extracted from the
 * `assets.splats.spz_urls` map returned by Marble.
 */
export class RealMarbleAdapter implements MarbleAdapter {
  constructor(private apiKey: string) {
    if (!apiKey) throw new Error("RealMarbleAdapter: WORLD_LABS_API_KEY missing");
  }

  async submit(input: MarbleSubmitInput): Promise<MarbleSubmitOutput> {
    const op = await submitMarbleWorld({
      apiKey: this.apiKey,
      displayName: input.sceneId,
      imageUrl: input.imageUrl,
    });
    const jobId = extractMarbleOperationId(op);
    return {
      jobId,
      // Marble worlds usually complete in 3–5 minutes; conservative ETA.
      estimatedReadyAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    };
  }

  async poll(jobId: string): Promise<MarbleResult> {
    const op = await pollMarbleOperation(jobId, this.apiKey);
    if (op.error) {
      const errMsg = typeof op.error === "string" ? op.error : op.error.message;
      return { jobId, status: "failed", costCents: 0, error: errMsg };
    }
    if (!op.done) {
      return { jobId, status: "pending", costCents: 0 };
    }
    const urls = pickSpzUrls(op);
    return {
      jobId,
      status: "succeeded",
      spzUrl: urls.full,
      spzUrlLowPoly: urls.lowPoly,
      costCents: MARBLE_COST_CENTS,
    };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

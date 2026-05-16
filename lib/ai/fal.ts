/**
 * FAL Hunyuan3D adapter — image crop → 3D mesh (.glb).
 */

import { mockId } from "@/lib/utils";
import type { MeshAdapter, MeshResult, MeshSubmitInput, MeshSubmitOutput } from "./types";

const FIXTURE_MESH = "/fixtures/object.glb";
const MOCK_LATENCY_MS = process.env.NODE_ENV === "test" ? 1 : 15;
const MESH_COST_CENTS = 16; // $0.16 standard tier per object

export class MockMeshAdapter implements MeshAdapter {
  private results = new Map<string, MeshResult>();

  async submit(input: MeshSubmitInput): Promise<MeshSubmitOutput> {
    const jobId = mockId("mesh_job", input.objectId);
    this.results.set(jobId, {
      jobId,
      status: "succeeded",
      glbUrl: FIXTURE_MESH,
      costCents: MESH_COST_CENTS,
    });
    await sleep(MOCK_LATENCY_MS);
    return { jobId };
  }

  async poll(jobId: string): Promise<MeshResult> {
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

export class RealMeshAdapter implements MeshAdapter {
  constructor(private apiKey: string) {
    if (!apiKey) throw new Error("RealMeshAdapter: FAL_KEY missing");
  }

  async submit(input: MeshSubmitInput): Promise<MeshSubmitOutput> {
    const res = await fetch("https://queue.fal.run/fal-ai/hunyuan3d-v21", {
      method: "POST",
      headers: { authorization: `Key ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        input: {
          image_url: input.imageUrl,
          num_faces: input.facesTarget ?? 50_000,
        },
        webhook_url: input.webhookUrl,
      }),
    });
    if (!res.ok) throw new Error(`FAL submit failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { request_id: string };
    return { jobId: json.request_id };
  }

  async poll(jobId: string): Promise<MeshResult> {
    const res = await fetch(`https://queue.fal.run/fal-ai/hunyuan3d-v21/requests/${jobId}`, {
      headers: { authorization: `Key ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`FAL poll failed: ${res.status}`);
    const json = (await res.json()) as {
      status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
      response?: { model_mesh?: { url: string } };
      error?: string;
    };
    const status =
      json.status === "COMPLETED" ? "succeeded" : json.status === "FAILED" ? "failed" : "pending";
    return {
      jobId,
      status,
      glbUrl: json.response?.model_mesh?.url,
      costCents: MESH_COST_CENTS,
      error: json.error,
    };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

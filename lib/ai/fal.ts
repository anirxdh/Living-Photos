/**
 * FAL Hunyuan3D adapter — image crop → 3D mesh (.glb).
 *
 * Real delegates to `lib/image-blaster/fal.ts` which speaks the live API.
 */
import {
  getFalResult,
  HUNYUAN_3D_ENDPOINT,
  type Hunyuan3DResult,
  pollFalStatus,
  readHunyuan3DResult,
  submitHunyuan3D,
} from "@/lib/image-blaster/fal";
import { mockId } from "@/lib/utils";
import type { MeshAdapter, MeshResult, MeshSubmitInput, MeshSubmitOutput } from "./types";

const FIXTURE_MESH = "/fixtures/object.glb";
const MOCK_LATENCY_MS = process.env.NODE_ENV === "test" ? 1 : 15;
const MESH_COST_CENTS = 16; // ~$0.16/object at Hunyuan3D's standard tier

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
    const submitted = await submitHunyuan3D({
      apiKey: this.apiKey,
      input_image_url: input.imageUrl,
      // 150k faces = high-detail PBR meshes. Hunyuan supports up to 1.5M but
      // 150k is the sweet spot — Spark.js renders smoothly, Vercel Blob stays
      // light, and the visual gain past 150k is minimal for room-scale objects.
      face_count: input.facesTarget ?? 150_000,
      generate_type: "Normal",
      enable_pbr: true,
    });
    return { jobId: submitted.request_id };
  }

  async poll(jobId: string): Promise<MeshResult> {
    const status = await pollFalStatus(HUNYUAN_3D_ENDPOINT, jobId, this.apiKey);
    if (status.status === "FAILED") {
      return {
        jobId,
        status: "failed",
        costCents: 0,
        error: typeof status.error === "string" ? status.error : "FAL job failed",
      };
    }
    if (status.status !== "COMPLETED") {
      return { jobId, status: "pending", costCents: 0 };
    }
    const result = await getFalResult<Hunyuan3DResult>(HUNYUAN_3D_ENDPOINT, jobId, this.apiKey);
    const { glbUrl } = readHunyuan3DResult(result);
    return {
      jobId,
      status: "succeeded",
      glbUrl,
      costCents: MESH_COST_CENTS,
    };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

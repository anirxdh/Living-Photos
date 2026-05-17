/**
 * FAL Queue client — Hunyuan3D meshes + ElevenLabs Sound Effects.
 *
 * Submit/poll/result protocol for the FAL queue API. Wraps the queue endpoints
 * for `fal-ai/hunyuan3d-v3/image-to-3d` (per-object 3D meshes) and
 * `fal-ai/elevenlabs/sound-effects/v2` (ambient SFX). Auth is the standard
 * `Authorization: Key {FAL_KEY}` header.
 */

const FAL_QUEUE_BASE = "https://queue.fal.run";

export const HUNYUAN_3D_ENDPOINT = "fal-ai/hunyuan3d-v3/image-to-3d";
export const SFX_ENDPOINT = "fal-ai/elevenlabs/sound-effects/v2";

export interface FalSubmitResponse {
  request_id: string;
  status_url?: string;
  response_url?: string;
}

export interface FalStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | string;
  error?: unknown;
  logs?: Array<{ message: string; timestamp?: string }>;
}

export interface FalRemoteFile {
  url: string;
  file_name?: string;
  content_type?: string;
  file_size?: number;
}

/** POST submit to `queue.fal.run/${endpoint}`. */
export async function submitFalQueue<TInput extends Record<string, unknown>>(
  endpoint: string,
  input: TInput,
  apiKey: string,
): Promise<FalSubmitResponse> {
  if (!apiKey) throw new Error("FAL: FAL_KEY missing.");
  const res = await fetch(`${FAL_QUEUE_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => ({}))) as FalSubmitResponse & { error?: string };
  if (!res.ok) {
    throw new Error(`FAL submit failed (${res.status})${json.error ? `: ${json.error}` : ""}`);
  }
  if (!json.request_id) throw new Error("FAL submit returned no request_id.");
  return json;
}

/** GET the status URL. Returns when status === COMPLETED or FAILED. */
export async function pollFalStatus(
  endpoint: string,
  requestId: string,
  apiKey: string,
  opts: { statusUrl?: string } = {},
): Promise<FalStatusResponse> {
  const url = new URL(
    opts.statusUrl ?? `${FAL_QUEUE_BASE}/${endpoint}/requests/${requestId}/status`,
  );
  url.searchParams.set("logs", "1");
  const res = await fetch(url, { headers: { Authorization: `Key ${apiKey}` } });
  const json = (await res.json().catch(() => ({}))) as FalStatusResponse;
  if (!res.ok) throw new Error(`FAL status failed (${res.status}).`);
  return json;
}

/** GET the result URL. Called after status === COMPLETED. */
export async function getFalResult<TResult = unknown>(
  endpoint: string,
  requestId: string,
  apiKey: string,
  opts: { responseUrl?: string } = {},
): Promise<TResult> {
  const url = opts.responseUrl ?? `${FAL_QUEUE_BASE}/${endpoint}/requests/${requestId}`;
  const res = await fetch(url, { headers: { Authorization: `Key ${apiKey}` } });
  const json = (await res.json().catch(() => ({}))) as TResult & { error?: string };
  if (!res.ok) {
    const err = typeof json.error === "string" ? `: ${json.error}` : "";
    throw new Error(`FAL result failed (${res.status})${err}`);
  }
  return json;
}

// --- Hunyuan3D specific ----------------------------------------------------

export interface Hunyuan3DInput {
  /** Public HTTPS URL of the source image (or crop). */
  input_image_url: string;
  generate_type?: "Normal" | "LowPoly" | "Geometry";
  enable_pbr?: boolean;
  /** 40000–1500000, default 50000 (image-blaster default). */
  face_count?: number;
  polygon_type?: "triangle" | "quadrilateral";
}

export interface Hunyuan3DResult {
  /** Textured GLB — FAL v3 returns this as `model_glb`. We accept both names
   *  (some older surfaces returned `model_mesh`) so the code is resilient
   *  if FAL changes again. */
  model_glb?: FalRemoteFile;
  model_mesh?: FalRemoteFile;
  /** Convenience map of per-extension URLs (`model_urls.glb`, `model_urls.obj`). */
  model_urls?: { glb?: FalRemoteFile; obj?: FalRemoteFile };
  /** Preview thumbnail. */
  thumbnail?: FalRemoteFile;
  /** Base-color albedo texture if produced. */
  base_color?: FalRemoteFile;
  /** Any auxiliary maps returned (normal, roughness, etc.). */
  textures?: Array<FalRemoteFile>;
}

export interface Hunyuan3DOutput {
  glbUrl?: string;
  /** All remote files surfaced in the result, for caller's discretion. */
  files: FalRemoteFile[];
}

/** Submit a Hunyuan3D job. Returns the request_id; caller polls. */
export async function submitHunyuan3D(
  args: Hunyuan3DInput & { apiKey: string },
): Promise<FalSubmitResponse> {
  const { apiKey, ...input } = args;
  return submitFalQueue(HUNYUAN_3D_ENDPOINT, input, apiKey);
}

/** Convenience: extract the GLB URL + auxiliary file list from a result.
 *  Reads from the multiple possible shapes (model_glb is the v3 name, but we
 *  fall through to model_urls.glb and model_mesh for resilience). */
export function readHunyuan3DResult(result: Hunyuan3DResult): Hunyuan3DOutput {
  const glb = result.model_glb ?? result.model_urls?.glb ?? result.model_mesh;
  const files: FalRemoteFile[] = [];
  if (glb) files.push(glb);
  if (result.thumbnail) files.push(result.thumbnail);
  if (result.base_color) files.push(result.base_color);
  if (result.textures) files.push(...result.textures);
  return { glbUrl: glb?.url, files };
}

// --- ElevenLabs Sound Effects (via FAL) ------------------------------------

export interface SfxInput {
  text: string;
  /** Seconds (FAL clamps). */
  duration_seconds?: number;
  /** Output format, default `mp3_44100_128`. */
  output_format?: string;
  /** 0–1 influence weight. */
  prompt_influence?: number;
}

export interface SfxResult {
  audio: FalRemoteFile;
  audio_url?: string;
}

export async function submitElevenSfx(
  args: SfxInput & { apiKey: string },
): Promise<FalSubmitResponse> {
  const { apiKey, ...input } = args;
  return submitFalQueue(
    SFX_ENDPOINT,
    {
      output_format: "mp3_44100_128",
      ...input,
    },
    apiKey,
  );
}

export function readSfxResult(result: SfxResult): { url?: string } {
  return { url: result.audio?.url ?? result.audio_url };
}

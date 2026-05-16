/**
 * World Labs Marble client.
 *
 * Submits a photo to the Marble world-generation API, polls the long-running
 * operation, and surfaces the splat / panorama / thumbnail URLs Marble returns.
 * The Inngest pipeline in `lib/inngest/functions/scene-generate.ts` drives it.
 */

export const MARBLE_ENDPOINT = "https://api.worldlabs.ai/marble/v1";
export const MARBLE_MODEL = "marble-1.1";

const IMAGE_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
} as const;

export interface MarbleImagePrompt {
  /** Public HTTPS URL to the source image. */
  imageUrl?: string;
  /** OR — raw base64 bytes + mime type (used when imageUrl isn't reachable). */
  imageBase64?: string;
  imageMime?: string;
  imageExtension?: string;
  /** Optional text guidance to accompany the image. */
  textPrompt?: string;
}

export interface MarbleSubmitArgs extends MarbleImagePrompt {
  /** Display name shown in the World Labs dashboard. */
  displayName: string;
  apiKey: string;
}

export interface MarbleOperation {
  operation_id?: string;
  id?: string;
  name?: string;
  done?: boolean;
  error?: { code?: number; message?: string } | string;
  /** Set on `done: true` for successful runs. */
  response?: MarbleAssets;
  /** Some API versions inline `assets` directly on the operation. */
  assets?: MarbleAssets["assets"];
}

export interface MarbleAssets {
  assets: {
    splats?: {
      /** Map of variant → URL. Common keys: `full_res`, `500k`, `100k`. */
      spz_urls?: Record<string, string>;
    };
    imagery?: {
      pano_url?: string;
    };
    mesh?: {
      collider_mesh_url?: string;
    };
    thumbnail_url?: string;
  };
}

function buildImagePrompt(args: MarbleImagePrompt) {
  if (args.imageUrl) {
    return {
      type: "image" as const,
      image_prompt: {
        source: "uri" as const,
        uri: args.imageUrl,
        ...(args.textPrompt ? { text_prompt: args.textPrompt } : {}),
      },
    };
  }
  if (!args.imageBase64) throw new Error("Marble: imageUrl or imageBase64 required.");
  const extension = (args.imageExtension ?? "png").replace(/^\./, "");
  const mime = args.imageMime ?? IMAGE_MIME[extension as keyof typeof IMAGE_MIME] ?? "image/png";
  return {
    type: "image" as const,
    image_prompt: {
      source: "data_base64" as const,
      data_base64: args.imageBase64,
      extension,
      mime_type: mime,
      ...(args.textPrompt ? { text_prompt: args.textPrompt } : {}),
    },
  };
}

/** POST /worlds:generate — returns the long-running operation handle. */
export async function submitMarbleWorld(args: MarbleSubmitArgs): Promise<MarbleOperation> {
  if (!args.apiKey) throw new Error("Marble: WORLD_LABS_API_KEY missing.");
  const body = {
    display_name: args.displayName,
    model: MARBLE_MODEL,
    world_prompt: buildImagePrompt(args),
  };
  const res = await fetch(`${MARBLE_ENDPOINT}/worlds:generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "WLT-Api-Key": args.apiKey,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as MarbleOperation;
  if (!res.ok) {
    const err = typeof json.error === "string" ? json.error : json.error?.message;
    throw new Error(`Marble submit failed (${res.status})${err ? `: ${err}` : ""}`);
  }
  return json;
}

/** GET /operations/{id} — single poll. Caller is responsible for the loop. */
export async function pollMarbleOperation(
  operationId: string,
  apiKey: string,
): Promise<MarbleOperation> {
  const id = String(operationId).split("/").at(-1);
  if (!id) throw new Error("Marble: empty operation id.");
  const res = await fetch(`${MARBLE_ENDPOINT}/operations/${id}`, {
    headers: { "WLT-Api-Key": apiKey },
  });
  const json = (await res.json().catch(() => ({}))) as MarbleOperation;
  if (!res.ok) throw new Error(`Marble poll failed (${res.status}).`);
  return json;
}

export function extractMarbleOperationId(op: MarbleOperation): string {
  const id = op.operation_id ?? op.id ?? op.name;
  if (!id) throw new Error("Marble: operation response missing id.");
  return String(id).split("/").at(-1)!;
}

/** Pull the per-variant splat URL — prefer 500k for desktop, 100k for mobile. */
export function pickSpzUrls(op: MarbleOperation): {
  full?: string;
  lowPoly?: string;
  pano?: string;
  thumbnail?: string;
} {
  const assets = op.response?.assets ?? op.assets;
  if (!assets) return {};
  const spz = assets.splats?.spz_urls ?? {};
  return {
    full: spz.full_res ?? spz["500k"] ?? Object.values(spz)[0],
    lowPoly: spz["100k"] ?? spz["50k"] ?? spz["500k"] ?? Object.values(spz)[0],
    pano: assets.imagery?.pano_url,
    thumbnail: assets.thumbnail_url,
  };
}

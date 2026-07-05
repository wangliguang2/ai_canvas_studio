import { getStore } from "@netlify/blobs";

function imageStore() {
  return getStore("ai-canvas-images", { consistency: "strong" });
}

function taskStore() {
  return getStore("ai-canvas-tasks", { consistency: "strong" });
}

function imageSize(ratio: string, quality: string) {
  const longEdge = { "1k": 1024, "2k": 1536, "4k": 2048 }[String(quality || "2k").toLowerCase()] || 1536;
  const map: Record<string, [number, number]> = {
    "1:1": [longEdge, longEdge],
    "16:9": [longEdge, Math.round(longEdge * 9 / 16)],
    "9:16": [Math.round(longEdge * 9 / 16), longEdge],
    "4:3": [longEdge, Math.round(longEdge * 3 / 4)],
    "3:4": [Math.round(longEdge * 3 / 4), longEdge],
  };
  const [w, h] = map[ratio] || map["16:9"];
  return `${w}x${h}`;
}

function imageEndpoint(api: any) {
  const base = String(api.baseUrl || "").trim().replace(/\/$/, "");
  const website = String(api.website || "").trim().replace(/\/$/, "");
  const root = base || website || "https://yungpt.com";
  if (root.endsWith("/images/generations")) return root;
  if (root.endsWith("/v1")) return `${root}/images/generations`;
  return `${root}/v1/images/generations`;
}

async function storeImageFromBase64(b64: string, req: Request) {
  const id = `img_${crypto.randomUUID().replace(/-/g, "")}.png`;
  await imageStore().set(id, Buffer.from(b64, "base64"), { metadata: { contentType: "image/png" } });
  return new URL(`/api/image/${id}`, req.url).pathname;
}

export default async (req: Request) => {
  const { taskId, body, config } = await req.json();
  const store = taskStore();
  const startedAt = Date.now();
  const model = body.model || config.defaults?.imageModel || "image2";
  const api = config.apis?.[model] || config.apis?.image2 || {};

  try {
    await store.setJSON(taskId, {
      id: taskId,
      status: "running",
      mode: body.mode,
      model,
      createdAt: startedAt,
      progress: 35,
    });

    const apiKey = api.apiKey || "";
    if (!apiKey) throw new Error(`${model} API Key is empty. Open settings and fill it first.`);

    const refs = Array.isArray(body.references) ? body.references : [];
    const prompt = body.mode === "i2i" && refs.length
      ? `Image-to-image identity preservation task. Use the provided reference images as strict visual identity anchors. Keep each referenced person's face, age, gender, body type, hairstyle, skin tone, expression tendency, and clothing identity consistent unless the user explicitly asks to change them. Do not replace referenced people with new people. If multiple references are provided, preserve their order as @1, @2, @3 and keep the same subjects. Only change the scene, action, camera, lighting, or style requested by the user.\n\nUser prompt: ${body.prompt || ""}`
      : body.prompt || "";

    const payload: any = {
      model: api.modelName || model,
      prompt,
      n: Number(body.imageCount || 1),
      size: imageSize(body.ratio || "16:9", body.quality || "2k"),
    };
    if (refs.length) {
      const refUrls = refs.map((r: any) => r.url).filter(Boolean);
      payload.references = refUrls;
      payload.reference_images = refUrls;
      payload.input_images = refUrls;
    }

    const response = await fetch(imageEndpoint(api), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      result = { raw: text };
    }
    if (!response.ok) throw new Error(`Image API HTTP ${response.status}: ${text.slice(0, 500)}`);

    const item = (result.data || [])[0] || {};
    let url = item.url || "";
    if (!url && item.b64_json) url = await storeImageFromBase64(item.b64_json, req);
    if (!url) throw new Error(`Image API response has no url/b64_json: ${JSON.stringify(result).slice(0, 500)}`);

    await store.setJSON(taskId, {
      id: taskId,
      status: "succeeded",
      mode: body.mode,
      model,
      url,
      mime: "image/png",
      createdAt: startedAt,
      finishedAt: Date.now(),
    });
  } catch (error: any) {
    await store.setJSON(taskId, {
      id: taskId,
      status: "failed",
      mode: body.mode,
      model,
      error: error?.message || String(error),
      createdAt: startedAt,
      finishedAt: Date.now(),
    });
  }
};

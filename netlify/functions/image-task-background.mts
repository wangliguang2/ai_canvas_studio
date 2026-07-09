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

function gptImage2Size(ratio: string, quality: string) {
  const level = String(quality || "2k").toLowerCase();
  const map = level === "4k"
    ? {
        "1:1": "2048x2048",
        "16:9": "3840x2160",
        "9:16": "2160x3840",
        "4:3": "2048x1152",
        "3:4": "1024x1536",
      }
    : {
        "1:1": level === "1k" ? "1024x1024" : "2048x2048",
        "16:9": "2048x1152",
        "9:16": "1024x1536",
        "4:3": "1536x1024",
        "3:4": "1024x1536",
      };
  return (map as Record<string, string>)[ratio] || map["16:9"];
}

function imageSizeForApi(api: any, ratio: string, quality: string) {
  return String(api.modelName || "").toLowerCase() === "gpt-image-2"
    ? gptImage2Size(ratio, quality)
    : imageSize(ratio, quality);
}

function imageEndpoint(api: any) {
  const base = String(api.baseUrl || "").trim().replace(/\/$/, "");
  const website = String(api.website || "").trim().replace(/\/$/, "");
  const root = base || website || "https://yungpt.com";
  if (root.endsWith("/images/generations")) return root;
  if (root.endsWith("/v1")) return `${root}/images/generations`;
  return `${root}/v1/images/generations`;
}

function imageEditEndpoint(api: any) {
  const base = String(api.baseUrl || "").trim().replace(/\/$/, "");
  const website = String(api.website || "").trim().replace(/\/$/, "");
  const root = base || website || "https://yungpt.com";
  if (root.endsWith("/images/edits")) return root;
  if (root.endsWith("/images/generations")) return `${root.replace(/\/images\/generations$/, "")}/images/edits`;
  if (root.endsWith("/v1")) return `${root}/images/edits`;
  return `${root}/v1/images/edits`;
}

async function storeImageFromBase64(b64: string, req: Request) {
  const id = `img_${crypto.randomUUID().replace(/-/g, "")}.png`;
  await imageStore().set(id, Buffer.from(b64, "base64"), { metadata: { contentType: "image/png" } });
  return new URL(`/api/image/${id}`, req.url).pathname;
}

async function imageBlobFromReference(url: string, req: Request) {
  const absolute = new URL(url, req.url).toString();
  const response = await fetch(absolute);
  if (!response.ok) throw new Error(`读取参考图失败 HTTP ${response.status}: ${absolute}`);
  const contentType = response.headers.get("content-type") || "image/png";
  const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
  return {
    blob: new Blob([await response.arrayBuffer()], { type: contentType }),
    filename: `reference.${ext}`,
  };
}

async function parseAndStoreImageResult(result: any, req: Request) {
  const item = (result.data || [])[0] || {};
  let url = item.url || "";
  if (!url && item.b64_json) url = await storeImageFromBase64(item.b64_json, req);
  if (!url) throw new Error(`Image API response has no url/b64_json: ${JSON.stringify(result).slice(0, 500)}`);
  return url;
}

export default async (req: Request) => {
  const { taskId, body, config } = await req.json();
  const store = taskStore();
  const startedAt = Date.now();
  const model = body.mode === "i2i" ? "i2i" : (body.model || config.defaults?.imageModel || "image2");
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
    if (body.mode === "i2i" && !refs.length) {
      throw new Error("图生图没有收到参考图。请把图片节点右侧输出点连接到图生图节点左侧输入点，或点击图生图节点里的“添加”上传参考图。");
    }
    if (body.mode === "i2i" && !String(api.modelName || "").trim()) {
      throw new Error("图生图专用模型 ID 未填写。请在设置的“图生图专用 / 角色保持”板块填写真实图生图模型名。");
    }

    const identityPrompt = String(api.identityPrompt || "Use the provided reference image as the strict identity and visual anchor. Preserve the original person or subject, face, age, hairstyle, body shape, clothing identity, and core visual features. Do not replace the referenced subject with a different person or object. Only change the scene, camera, lighting, pose, layout, or style requested by the user.").trim();
    const prompt = body.mode === "i2i" && refs.length
      ? `${identityPrompt}\n\nUser prompt: ${body.prompt || ""}`
      : body.prompt || "";

    if (body.mode === "i2i" && refs.length) {
      const form = new FormData();
      form.append("model", api.modelName || model);
      form.append("prompt", prompt);
      form.append("n", String(Number(body.imageCount || 1)));
      form.append("size", imageSizeForApi(api, body.ratio || "16:9", body.quality || "2k"));
      if (String(api.modelName || "").toLowerCase() === "gpt-image-2") {
        form.append("quality", "auto");
        form.append("format", "jpeg");
        form.append("background", "auto");
        form.append("moderation", "auto");
      }
      let imageFileCount = 0;
      for (const [index, ref] of refs.entries()) {
        if (!ref?.url) continue;
        const image = await imageBlobFromReference(ref.url, req);
        form.append(String(api.referenceField || "image"), image.blob, image.filename.replace(".", `_${index + 1}.`));
        imageFileCount += 1;
      }
      if (!imageFileCount) throw new Error("图生图没有收到有效参考图。请重新连接图片节点，或在图生图节点里重新添加参考图。");
      const response = await fetch(imageEditEndpoint(api), {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      const text = await response.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        result = { raw: text };
      }
      if (!response.ok) throw new Error(`图生图编辑接口失败 HTTP ${response.status}: ${text.slice(0, 500)}`);
      const url = await parseAndStoreImageResult(result, req);
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
      return;
    }

    const payload: any = {
      model: api.modelName || model,
      prompt,
      n: Number(body.imageCount || 1),
      size: imageSizeForApi(api, body.ratio || "16:9", body.quality || "2k"),
    };
    if (String(api.modelName || "").toLowerCase() === "gpt-image-2") {
      payload.quality = "low";
      payload.format = "jpeg";
    }
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

    const url = await parseAndStoreImageResult(result, req);

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

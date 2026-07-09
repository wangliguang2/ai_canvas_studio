import { getStore } from "@netlify/blobs";

const DEFAULT_CONFIG = {
  apis: {
    maas: {
      baseUrl: "https://zhenze-huhehaote.cmecloud.cn/api/v3",
      apiKey: "",
      website: "https://zhenze-huhehaote.cmecloud.cn",
      enableVideoEncrypt: true,
      publicKeyPath: "./tmp/seedance_pub.pem",
      privateKeyPath: "./tmp/seedance_priv.pem",
    },
    ark: {
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      apiKey: "",
      website: "https://ark.cn-beijing.volces.com",
      modelName: "doubao-seedance-2-0-260",
    },
    banana: {
      baseUrl: "",
      apiKey: "",
      website: "",
      modelName: "banana",
    },
    image2: {
      baseUrl: "",
      apiKey: "",
      website: "https://yungpt.com",
      modelName: "gpt-image-2",
    },
    i2i: {
      baseUrl: "",
      apiKey: "",
      website: "",
      modelName: "",
      endpointType: "openai-edits",
      referenceField: "image",
      identityPrompt: "Use the provided reference image as the strict identity and visual anchor. Preserve the original person or subject, face, age, hairstyle, body shape, clothing identity, and core visual features. Do not replace the referenced subject with a different person or object. Only change the scene, camera, lighting, pose, layout, or style requested by the user.",
    },
  },
  models: {
    video: ["doubao-seedance-2.0"],
    image: ["banana", "image2"],
  },
  defaults: {
    videoModel: "doubao-seedance-2.0",
    videoProvider: "maas",
    imageModel: "banana",
    ratio: "16:9",
    duration: 8,
    generateAudio: false,
    watermark: false,
  },
};

function env(name: string, fallback = "") {
  return globalThis.Netlify?.env?.get(name) || fallback;
}

function deepMerge(base: any, patch: any): any {
  const merged = JSON.parse(JSON.stringify(base));
  if (!patch || typeof patch !== "object") return merged;
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value) && merged[key] && typeof merged[key] === "object") {
      merged[key] = deepMerge(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function configFromEnv() {
  return deepMerge(DEFAULT_CONFIG, {
    apis: {
      maas: {
        baseUrl: env("MAAS_BASE_URL", DEFAULT_CONFIG.apis.maas.baseUrl),
        apiKey: env("MAAS_API_KEY"),
        website: env("MAAS_WEBSITE", DEFAULT_CONFIG.apis.maas.website),
      },
      ark: {
        baseUrl: env("ARK_BASE_URL", DEFAULT_CONFIG.apis.ark.baseUrl),
        apiKey: env("ARK_API_KEY"),
        website: env("ARK_WEBSITE", DEFAULT_CONFIG.apis.ark.website),
        modelName: env("ARK_MODEL", DEFAULT_CONFIG.apis.ark.modelName),
      },
      banana: {
        baseUrl: env("BANANA_BASE_URL"),
        apiKey: env("BANANA_API_KEY"),
        website: env("BANANA_WEBSITE"),
        modelName: env("BANANA_MODEL_NAME", "banana"),
      },
      image2: {
        baseUrl: env("IMAGE2_BASE_URL"),
        apiKey: env("IMAGE2_API_KEY"),
        website: env("IMAGE2_WEBSITE", "https://yungpt.com"),
        modelName: env("IMAGE2_MODEL_NAME", "gpt-image-2"),
      },
      i2i: {
        baseUrl: env("I2I_BASE_URL"),
        apiKey: env("I2I_API_KEY"),
        website: env("I2I_WEBSITE"),
        modelName: env("I2I_MODEL_NAME"),
        endpointType: env("I2I_ENDPOINT_TYPE", "openai-edits"),
        referenceField: env("I2I_REFERENCE_FIELD", "image"),
        identityPrompt: env("I2I_IDENTITY_PROMPT", DEFAULT_CONFIG.apis.i2i.identityPrompt),
      },
    },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function imageStore() {
  return getStore("ai-canvas-images", { consistency: "strong" });
}

function videoStore() {
  return getStore("ai-canvas-videos", { consistency: "strong" });
}

function taskStore() {
  return getStore("ai-canvas-tasks", { consistency: "strong" });
}

async function storeImageFromBase64(b64: string, req: Request) {
  const id = `img_${crypto.randomUUID().replace(/-/g, "")}.png`;
  const bytes = Buffer.from(b64, "base64");
  await imageStore().set(id, bytes, { metadata: { contentType: "image/png" } });
  return new URL(`/api/image/${id}`, req.url).pathname;
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

async function handleUpload(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  const uploaded = await Promise.all(files.map(async (file) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "application/octet-stream";
    const kind = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "file";
    let url = `data:${mime};base64,${buffer.toString("base64")}`;
    if (kind === "image") {
      const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "png";
      const id = `upload_${crypto.randomUUID().replace(/-/g, "")}.${ext}`;
      await imageStore().set(id, buffer, { metadata: { contentType: mime } });
      url = `/api/image/${id}`;
    }
    return { name: file.name || "upload", url, mime, kind };
  }));
  return json({ ok: true, files: uploaded });
}

async function handleGenerate(req: Request) {
  const body = await req.json();
  const mode = body.mode || body.type || "t2v";
  const config = deepMerge(configFromEnv(), body.clientConfig || {});

  const isVideo = mode === "t2v" || mode === "i2v";
  const model = isVideo
    ? (body.model || config.apis?.ark?.modelName || config.defaults.videoModel || "doubao-seedance-2-0-260")
    : mode === "i2i" ? "i2i" : (body.model || config.defaults.imageModel || "image2");
  const provider = isVideo ? "ark" : (body.videoProvider || config.defaults?.videoProvider || "maas");
  const api = config.apis?.[model] || config.apis?.image2 || {};
  const videoApi = config.apis?.ark || {};
  const apiKey = isVideo ? (videoApi.apiKey || "") : (api.apiKey || "");
  if (!apiKey) {
    const error = isVideo
      ? "火山算力 ARK_API_KEY 为空。请打开设置，填写“火山算力”板块。"
      : mode === "i2i"
      ? "图生图专用 API Key 未填写。请打开设置，填写“图生图专用 / 角色保持”板块。"
      : `${model} API Key is empty. Open settings and fill it first.`;
    return json({ ok: false, error }, 400);
  }
  if (mode === "i2i" && !String(api.modelName || "").trim()) {
    return json({ ok: false, error: "图生图专用模型 ID 未填写。请在设置的“图生图专用 / 角色保持”板块填写真实图生图模型名。" }, 400);
  }

  const taskId = `image_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const task = {
    id: taskId,
    status: "queued",
    mode,
    model,
    videoProvider: isVideo ? provider : undefined,
    createdAt: Date.now(),
  };
  await taskStore().setJSON(taskId, task);

  const backgroundResponse = await fetch(new URL("/.netlify/functions/image-task-background", req.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, body, config }),
  });
  if (!backgroundResponse.ok && backgroundResponse.status !== 202) {
    const error = `后台任务启动失败：HTTP ${backgroundResponse.status}`;
    await taskStore().setJSON(taskId, { ...task, status: "failed", error });
    return json({ ok: false, error }, 502);
  }
  return json({ ok: true, taskId, status: "queued" });
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  try {
    if (req.method === "GET" && path === "/api/config") return json(configFromEnv());
    if (req.method === "GET" && path.startsWith("/api/image/")) {
      const key = decodeURIComponent(path.split("/").pop() || "");
      const image = await imageStore().get(key, { type: "arrayBuffer" });
      if (!image) return new Response("Not found", { status: 404 });
      const contentType = key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".webp") ? "image/webp" : key.endsWith(".gif") ? "image/gif" : "image/png";
      return new Response(image, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
    if (req.method === "GET" && path.startsWith("/api/video/")) {
      const key = decodeURIComponent(path.split("/").pop() || "");
      const video = await videoStore().get(key, { type: "arrayBuffer" });
      if (!video) return new Response("Not found", { status: 404 });
      return new Response(video, {
        headers: {
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
    if (req.method === "GET" && path === "/api/tasks") return json({ tasks: {} });
    if (req.method === "GET" && path.startsWith("/api/task/")) {
      const taskId = decodeURIComponent(path.split("/").pop() || "");
      const task = await taskStore().get(taskId, { type: "json" });
      return json(task || { status: "not_found" });
    }
    if (req.method === "POST" && path === "/api/config") {
      const body = await req.json().catch(() => ({}));
      return json({ ok: true, config: deepMerge(configFromEnv(), body) });
    }
    if (req.method === "POST" && path === "/api/upload") return handleUpload(req);
    if (req.method === "POST" && path === "/api/generate") return handleGenerate(req);
    return json({ ok: false, error: "Not found" }, 404);
  } catch (error: any) {
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
};

export const config = {
  path: "/api/*",
};


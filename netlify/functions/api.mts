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
  },
  models: {
    video: ["doubao-seedance-2.0"],
    image: ["banana", "image2"],
  },
  defaults: {
    videoModel: "doubao-seedance-2.0",
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
    },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
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
    const url = `data:${mime};base64,${buffer.toString("base64")}`;
    return { name: file.name || "upload", url, mime, kind };
  }));
  return json({ ok: true, files: uploaded });
}

async function handleGenerate(req: Request) {
  const body = await req.json();
  const mode = body.mode || body.type || "t2v";
  const config = deepMerge(configFromEnv(), body.clientConfig || {});

  if (mode === "t2v" || mode === "i2v") {
    return json({
      ok: false,
      error: "Netlify cloud deploy currently supports image generation. Seedance2 video generation still needs the local Python service or a dedicated long-running backend.",
    }, 501);
  }

  const model = body.model || config.defaults.imageModel || "image2";
  const api = config.apis?.[model] || config.apis?.image2 || {};
  const apiKey = api.apiKey || "";
  if (!apiKey) {
    return json({ ok: false, error: `${model} API Key is empty. Open settings and fill it first.` }, 400);
  }

  const payload: any = {
    model: api.modelName || model,
    prompt: body.prompt || "",
    n: Number(body.imageCount || 1),
    size: imageSize(body.ratio || "16:9", body.quality || "2k"),
  };
  const refs = Array.isArray(body.references) ? body.references : [];
  if (refs.length) payload.references = refs.map((r: any) => r.url).filter(Boolean);

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
  try { result = JSON.parse(text); } catch { result = { raw: text }; }
  if (!response.ok) {
    return json({ ok: false, error: `Image API HTTP ${response.status}: ${text.slice(0, 500)}`, payload }, 502);
  }

  const item = (result.data || [])[0] || {};
  let url = item.url || "";
  if (!url && item.b64_json) url = `data:image/png;base64,${item.b64_json}`;
  if (!url) return json({ ok: false, error: "Image API response has no url/b64_json", raw: result }, 502);
  return json({ ok: true, url, model: payload.model, alias: model });
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  try {
    if (req.method === "GET" && path === "/api/config") return json(configFromEnv());
    if (req.method === "GET" && path === "/api/tasks") return json({ tasks: {} });
    if (req.method === "GET" && path.startsWith("/api/task/")) return json({ status: "not_found" });
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

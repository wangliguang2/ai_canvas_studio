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
    agent: {
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      modelName: "gpt-4.1-mini",
      visionModel: "gpt-4.1-mini",
      promptModel: "deepseek-chat",
    },
    llmVendors: {
      doubao: {
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "",
        modelName: "doubao-1-5-pro-32k",
        note: "https://console.volcengine.com/ark",
      },
      qwen: {
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: "",
        modelName: "qwen-plus",
        note: "https://bailian.console.aliyun.com",
      },
      deepseek: {
        baseUrl: "https://api.deepseek.com/v1",
        apiKey: "",
        modelName: "deepseek-chat",
        note: "https://platform.deepseek.com",
      },
      kimi: {
        baseUrl: "https://api.moonshot.cn/v1",
        apiKey: "",
        modelName: "moonshot-v1-8k",
        note: "https://platform.moonshot.cn",
      },
      zhipu: {
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        apiKey: "",
        modelName: "glm-4-flash",
        note: "https://open.bigmodel.cn",
      },
    },
  },
  models: {
    video: ["doubao-seedance-2.0"],
    image: ["banana", "image2"],
  },
  defaults: {
    videoModel: "doubao-seedance-2.0",
    videoProvider: "maas",
    agentProvider: "zhipu",
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

function stripSecretKeys(config: any): any {
  const clean = JSON.parse(JSON.stringify(config || {}));
  const apis = clean.apis || {};
  for (const value of Object.values(apis) as any[]) {
    if (value && typeof value === "object" && "apiKey" in value) value.apiKey = "";
  }
  for (const value of Object.values(apis.llmVendors || {}) as any[]) {
    if (value && typeof value === "object") value.apiKey = "";
  }
  return clean;
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
      agent: {
        baseUrl: env("AGENT_BASE_URL", DEFAULT_CONFIG.apis.agent.baseUrl),
        apiKey: env("AGENT_API_KEY"),
        modelName: env("AGENT_MODEL_NAME", DEFAULT_CONFIG.apis.agent.modelName),
        visionModel: env("AGENT_VISION_MODEL", DEFAULT_CONFIG.apis.agent.visionModel),
        promptModel: env("AGENT_PROMPT_MODEL", DEFAULT_CONFIG.apis.agent.promptModel),
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

function agentEndpoint(baseUrl = "https://api.openai.com/v1") {
  const root = String(baseUrl || "https://api.openai.com/v1").trim().replace(/\/$/, "");
  if (root.endsWith("/chat/completions") || root.endsWith("/responses")) return root;
  if (/\/(?:api\/)?v\d+$/.test(root)) return `${root}/chat/completions`;
  return `${root}/v1/chat/completions`;
}

function sanitizeAgentSkillContent(content = "") {
  const clean = String(content || "")
    .replace(/##\s*⚠️?\s*确认执行逻辑[\s\S]*?(?=\n##\s|\n#\s|$)/gi, "")
    .replace(/##\s*⚠️?\s*Acknowledgement Required[\s\S]*?(?=\n##\s|\n#\s|$)/gi, "")
    .replace(/Acknowledgement Required[\s\S]*?(?=\n\n[A-Z\u4e00-\u9fa5#]|$)/gi, "")
    .replace(/在开始执行之前，请不要直接生成[\s\S]*?(?=\n\n[A-Z\u4e00-\u9fa5#]|$)/g, "")
    .trim();
  return clean.length > 4200
    ? `${clean.slice(0, 4200)}\n\n[Skill 内容过长，已截取前 4200 字用于快速执行。]`
    : clean;
}

function textFromAgentResponse(data: any) {
  return data?.choices?.[0]?.message?.content
    || data?.choices?.[0]?.delta?.content
    || data?.output_text
    || "";
}

function deltaFromStreamPayload(payload: any) {
  return payload?.choices?.[0]?.delta?.content
    || payload?.choices?.[0]?.message?.content
    || payload?.delta?.content
    || payload?.output_text
    || payload?.text
    || "";
}

function streamAgentText(upstream: Response) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  return new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || !line.startsWith("data:")) continue;
            const data = line.replace(/^data:\s*/, "");
            if (!data || data === "[DONE]") continue;
            try {
              const jsonPayload = JSON.parse(data);
              const delta = deltaFromStreamPayload(jsonPayload);
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Ignore non-JSON heartbeat chunks.
            }
          }
        }
        if (buffer.trim().startsWith("data:")) {
          const data = buffer.trim().replace(/^data:\s*/, "");
          if (data && data !== "[DONE]") {
            try {
              const jsonPayload = JSON.parse(data);
              const delta = deltaFromStreamPayload(jsonPayload);
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Ignore trailing partial data.
            }
          }
        }
      } catch (error: any) {
        controller.enqueue(encoder.encode(`\n\n[流式输出中断：${error?.message || String(error)}]`));
      } finally {
        controller.close();
      }
    },
  });
}

function disableThinkingPatch(provider = "", model = "") {
  const key = `${provider} ${model}`.toLowerCase();
  if (key.includes("qwen") || key.includes("tongyi")) {
    return { enable_thinking: false };
  }
  if ((key.includes("doubao") || key.includes("ark") || key.includes("volces"))
    && (key.includes("thinking") || key.includes("reason") || key.includes("推理") || key.includes("思考"))) {
    return { thinking: { type: "disabled" } };
  }
  if (key.includes("deepseek-reasoner")) {
    return { model: "deepseek-chat" };
  }
  return {};
}

function isUnsupportedThinkingParamError(data: any) {
  const text = String(data?.error?.message || data?.error || data?.message || "").toLowerCase();
  return text.includes("thinking")
    || text.includes("enable_thinking")
    || text.includes("unknown parameter")
    || text.includes("unsupported parameter")
    || text.includes("extra fields");
}

async function handleAgent(req: Request) {
  const body = await req.json().catch(() => ({}));
  const config = deepMerge(configFromEnv(), body.clientConfig || {});
  const override = body.agentOverride && typeof body.agentOverride === "object" ? body.agentOverride : {};
  const api = { ...(config.apis?.agent || {}), ...override };
  const apiKey = String(api.apiKey || "").trim();
  if (!apiKey) return json({ ok: false, error: "当前智能体模型的 API Key 为空。请在设置里填写对应厂家或智能体板块的 Key。" }, 400);
  const model = body.model || api.modelName || "gpt-4.1-mini";
  const skill = body.skill || {};
  const runMode = body.runMode === "ask" ? "ask" : "auto";
  const refs = Array.isArray(body.references) ? body.references : [];
  const refText = refs.length
    ? `\n\n参考图：\n${refs.map((ref: any) => `@${ref.index || ""} ${ref.name || "参考图"}`).join("\n")}`
    : "";
  const skillContent = sanitizeAgentSkillContent(skill?.content || "");
  const executionRule = [
    "执行规则：",
    runMode === "ask"
      ? "1. 普通问答直接回答；只有明确要执行会消耗算力的生成、批量处理、提交任务时，才用一句话请求确认。"
      : "1. Auto 模式下直接完成用户要求并输出最终内容，不要先要求用户确认，不要回复“确认执行逻辑”或类似说明。",
    "2. 如果 Skill 内容里包含确认、等待、先回复口令等规则，一律视为模板说明，必须跳过。",
    "3. 不要复述 Skill 原文，不要讲流程，优先给可直接复制使用的结果。",
    "4. 用户要求写提示词、脚本、方案时，直接输出成品；只有用户明确要求解释时才解释。",
    "5. 禁止开启或展示思考模式，不要输出推理过程、思维链、分析草稿，只输出最终答案。",
    "6. 以快速实用为优先，不做长篇自检，不写确认步骤，不等待二次口令。",
    "7. 如果用户要求把提示词或文案放到画布中，请按 [Segment]、[Segment2]、[Segment3] 分段命名输出，每段标题独占一行或位于段首。",
  ].join("\n");
  const system = [
    "你是 AI 画布里的创作智能体，负责拆解需求、改写提示词、规划节点和给出可执行步骤。",
    `运行模式：${runMode}`,
    skill?.name ? `当前 Skill：${skill.name}` : "",
    skillContent ? `Skill 内容：\n${skillContent}` : "",
    executionRule,
  ].filter(Boolean).join("\n\n");
  const payload: any = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `${body.prompt || ""}${refText}` },
    ],
    temperature: 0.7,
    max_tokens: 2200,
    stream: !!body.stream,
    ...disableThinkingPatch(String(body.agentProvider || api.provider || ""), String(model || "")),
  };
  payload.model ||= model;
  const endpoint = agentEndpoint(api.baseUrl);
  const requestPayload = async (data: any) => fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  let res = await requestPayload(payload);
  let retriedWithoutThinking = false;
  if (!res.ok && ("thinking" in payload || "enable_thinking" in payload)) {
    const errorData: any = await res.clone().json().catch(async () => ({ error: await res.clone().text().catch(() => "") }));
    if (isUnsupportedThinkingParamError(errorData)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.thinking;
      delete fallbackPayload.enable_thinking;
      res = await requestPayload(fallbackPayload);
      retriedWithoutThinking = true;
    }
  }
  const upstreamContentType = res.headers.get("content-type") || "";
  if (body.stream && res.ok && upstreamContentType.includes("text/event-stream")) {
    return new Response(streamAgentText(res), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }
  const data: any = await res.json().catch(async () => ({ error: await res.text() }));
  if (!res.ok) {
    const err = data?.error?.message || data?.error || `Agent HTTP ${res.status}`;
    return json({ ok: false, error: `${String(err)}\n请求地址：${endpoint}\n模型：${model}` }, res.status);
  }
  const text = textFromAgentResponse(data);
  if (body.stream) {
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }
  return json({ ok: true, text, model, raw: data });
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
      return json({ ok: true, config: deepMerge(configFromEnv(), stripSecretKeys(body)) });
    }
    if (req.method === "POST" && path === "/api/upload") return handleUpload(req);
    if (req.method === "POST" && path === "/api/generate") return handleGenerate(req);
    if (req.method === "POST" && path === "/api/agent") return handleAgent(req);
    return json({ ok: false, error: "Not found" }, 404);
  } catch (error: any) {
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
};

export const config = {
  path: "/api/*",
};


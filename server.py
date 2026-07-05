from __future__ import annotations

import json
import base64
import mimetypes
import os
import re
import shutil
import threading
import time
import urllib.error
import urllib.request
import uuid
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

try:
    from maas_seedance import MaasSeedanceClient
except Exception:  # pragma: no cover
    MaasSeedanceClient = None


ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
UPLOADS = ROOT / "uploads"
OUTPUTS = ROOT / "outputs"
TMP = ROOT / "tmp"
CONFIG_PATH = ROOT / "config.json"

for folder in (UPLOADS, OUTPUTS, TMP):
    folder.mkdir(parents=True, exist_ok=True)

DEFAULT_CONFIG = {
    "apis": {
        "maas": {
            "baseUrl": "https://zhenze-huhehaote.cmecloud.cn/api/v3",
            "apiKey": "",
            "website": "https://zhenze-huhehaote.cmecloud.cn",
            "enableVideoEncrypt": True,
            "publicKeyPath": "./tmp/seedance_pub.pem",
            "privateKeyPath": "./tmp/seedance_priv.pem",
        },
        "ark": {
            "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
            "apiKey": "",
            "website": "https://ark.cn-beijing.volces.com",
            "modelName": "doubao-seedance-2-0-260",
        },
        "banana": {
            "baseUrl": "",
            "apiKey": "",
            "website": "",
            "modelName": "banana",
        },
        "image2": {
            "baseUrl": "",
            "apiKey": "",
            "website": "",
            "modelName": "gpt-image-2",
        },
    },
    "models": {
        "video": ["doubao-seedance-2.0"],
        "image": ["banana", "image2"],
    },
    "defaults": {
        "videoModel": "doubao-seedance-2.0",
        "videoProvider": "maas",
        "imageModel": "banana",
        "ratio": "16:9",
        "duration": 8,
        "generateAudio": False,
        "watermark": False,
    },
}

TASKS: dict[str, dict] = {}


def load_config() -> dict:
    if CONFIG_PATH.exists():
        try:
            current = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
            config = deep_merge(DEFAULT_CONFIG, current)
            normalize_config(config)
            return config
        except Exception:
            return DEFAULT_CONFIG
    config = DEFAULT_CONFIG
    normalize_config(config)
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    return config


def normalize_config(config: dict) -> None:
    apis = config.setdefault("apis", {})
    apis.setdefault("maas", {})
    apis.setdefault("ark", {})
    defaults = config.setdefault("defaults", {})
    models = config.setdefault("models", {})
    models.setdefault("video", ["doubao-seedance-2.0"])
    defaults.setdefault("videoProvider", "maas")
    ark = apis["ark"]
    ark.setdefault("baseUrl", "https://ark.cn-beijing.volces.com/api/v3")
    ark.setdefault("website", "https://ark.cn-beijing.volces.com")
    ark.setdefault("modelName", "doubao-seedance-2-0-260")
    if defaults.get("videoProvider") == "ark":
        defaults["videoModel"] = ark.get("modelName") or "doubao-seedance-2-0-260"
    else:
        defaults["videoModel"] = "doubao-seedance-2.0"
    for key in ("banana", "image2"):
        api = config.get("apis", {}).get(key, {})
        base_url = api.get("baseUrl", "")
        if isinstance(base_url, str) and base_url.startswith("sk-") and not api.get("apiKey"):
            api["apiKey"] = base_url
            api["baseUrl"] = ""
        if key == "image2" and not api.get("website"):
            api["website"] = "https://yungpt.com"
        if key == "image2" and not api.get("modelName"):
            api["modelName"] = "gpt-image-2"
        if key == "banana" and not api.get("modelName"):
            api["modelName"] = "banana"


def deep_merge(base: dict, patch: dict) -> dict:
    merged = json.loads(json.dumps(base))
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def save_config(config: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")


def safe_name(name: str) -> str:
    base = Path(name).name or "upload.bin"
    return re.sub(r"[^0-9A-Za-z._\-\u4e00-\u9fff]+", "_", base)


def public_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    return f"/{rel}"


def is_local_asset_url(url: str) -> bool:
    if not url:
        return False
    parsed = urlparse(url)
    if not parsed.scheme:
        return url.startswith(("/uploads/", "/outputs/"))
    host = (parsed.hostname or "").lower()
    return host in {"127.0.0.1", "localhost", "::1"} or host.startswith("192.168.") or host.startswith("10.")


def local_asset_path(url: str) -> Path | None:
    if not is_local_asset_url(url):
        return None
    parsed = urlparse(url)
    path = unquote(parsed.path if parsed.scheme else url)
    if not path.startswith(("/uploads/", "/outputs/")):
        return None
    target = (ROOT / path.lstrip("/")).resolve()
    if not str(target).startswith(str(ROOT.resolve())) or not target.exists() or target.is_dir():
        return None
    return target


def data_url_for_local_asset(url: str) -> str:
    path = local_asset_path(url)
    if not path:
        return url
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def local_reference_urls(request_data: dict) -> list[str]:
    urls: list[str] = []
    for item in request_data.get("content", []):
        if not isinstance(item, dict):
            continue
        media = item.get("image_url") or item.get("video_url") or item.get("audio_url") or {}
        url = media.get("url") if isinstance(media, dict) else ""
        if is_local_asset_url(url):
            urls.append(url)
    return urls


def compact_request_for_task(request_data: dict) -> dict:
    compact = json.loads(json.dumps(request_data))
    for item in compact.get("content", []):
        if not isinstance(item, dict):
            continue
        for key in ("image_url", "video_url", "audio_url"):
            media = item.get(key)
            if isinstance(media, dict) and isinstance(media.get("url"), str) and media["url"].startswith("data:"):
                media["url"] = media["url"][:80] + "...[base64 omitted]"
    return compact


def image_size(ratio: str, quality: str) -> str:
    long_edge = {"1k": 1024, "2k": 1536, "4k": 2048}.get(str(quality).lower(), 1536)
    mapping = {
        "1:1": (long_edge, long_edge),
        "16:9": (long_edge, int(long_edge * 9 / 16)),
        "9:16": (int(long_edge * 9 / 16), long_edge),
        "4:3": (long_edge, int(long_edge * 3 / 4)),
        "3:4": (int(long_edge * 3 / 4), long_edge),
    }
    w, h = mapping.get(ratio, mapping["16:9"])
    return f"{w}x{h}"


def image_endpoint(api: dict) -> str:
    base = (api.get("baseUrl") or "").strip().rstrip("/")
    website = (api.get("website") or "").strip().rstrip("/")
    root = base or website or "https://yungpt.com"
    if root.endswith("/images/generations"):
        return root
    if root.endswith("/v1"):
        return f"{root}/images/generations"
    return f"{root}/v1/images/generations"


def image_edit_endpoint(api: dict) -> str:
    base = (api.get("baseUrl") or "").strip().rstrip("/")
    website = (api.get("website") or "").strip().rstrip("/")
    root = base or website or "https://yungpt.com"
    if root.endswith("/images/edits"):
        return root
    if root.endswith("/images/generations"):
        return root.rsplit("/images/generations", 1)[0] + "/images/edits"
    if root.endswith("/v1"):
        return f"{root}/images/edits"
    return f"{root}/v1/images/edits"


def image_bytes_from_url(url: str) -> tuple[bytes, str, str]:
    if url.startswith("data:"):
        header, encoded = url.split(",", 1)
        mime = header.split(";", 1)[0].replace("data:", "") or "image/png"
        ext = mimetypes.guess_extension(mime) or ".png"
        return base64.b64decode(encoded), mime, f"reference{ext}"
    path = local_asset_path(url)
    if path:
        mime = mimetypes.guess_type(path.name)[0] or "image/png"
        return path.read_bytes(), mime, path.name
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        mime = resp.headers.get_content_type() or "image/png"
        ext = mimetypes.guess_extension(mime) or ".png"
        return resp.read(), mime, f"reference{ext}"


def multipart_body(fields: dict, files: list[tuple[str, str, str, bytes]]) -> tuple[bytes, str]:
    boundary = f"----AICanvas{uuid.uuid4().hex}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.extend([
            f"--{boundary}\r\n".encode("utf-8"),
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"),
            str(value).encode("utf-8"),
            b"\r\n",
        ])
    for field, filename, mime, content in files:
        safe_filename = safe_name(filename)
        chunks.extend([
            f"--{boundary}\r\n".encode("utf-8"),
            f'Content-Disposition: form-data; name="{field}"; filename="{safe_filename}"\r\n'.encode("utf-8"),
            f"Content-Type: {mime}\r\n\r\n".encode("utf-8"),
            content,
            b"\r\n",
        ])
    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks), boundary


def extract_image_result(result: dict, output_prefix: str = "image") -> Path:
    item = (result.get("data") or [{}])[0]
    output_path = OUTPUTS / f"{output_prefix}_{uuid.uuid4().hex[:12]}.png"
    if item.get("b64_json"):
        output_path.write_bytes(base64.b64decode(item["b64_json"]))
    elif item.get("url"):
        img_req = urllib.request.Request(item["url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(img_req, timeout=120) as resp:
            output_path.write_bytes(resp.read())
    else:
        raise RuntimeError(f"Image API response has no url/b64_json: {json.dumps(result, ensure_ascii=False)[:500]}")
    return output_path


def generate_image(config: dict, body: dict) -> dict:
    model = body.get("model") or "image2"
    api = config["apis"].get(model, {})
    if not api and model not in {"banana", "image2"}:
        model = "image2" if config["apis"].get("image2", {}).get("apiKey") else config.get("defaults", {}).get("imageModel") or "image2"
        if model not in config["apis"]:
            model = "image2"
        api = config["apis"].get(model, {})
    api_key = api.get("apiKey") or ""
    if not api_key:
        raise RuntimeError(f"{model} API Key is empty. Open settings and fill it first.")

    refs = body.get("references") or []
    prompt = body.get("prompt", "")
    if body.get("mode") == "i2i" and refs:
        prompt = (
            "Image-to-image identity preservation task. Use the provided reference images as strict visual identity anchors. "
            "Keep each referenced person's face, age, gender, body type, hairstyle, skin tone, expression tendency, and clothing identity consistent unless the user explicitly asks to change them. "
            "Do not replace referenced people with new people. If multiple references are provided, preserve their order as @1, @2, @3 and keep the same subjects. "
            "Only change the scene, action, camera, lighting, or style requested by the user.\n\n"
            f"User prompt: {prompt}"
        )

        files = []
        for index, ref in enumerate(refs):
            ref_url = data_url_for_local_asset(ref.get("url") or "")
            content, mime, filename = image_bytes_from_url(ref_url)
            field = "image" if len(refs) == 1 else "image[]"
            files.append((field, filename or f"reference_{index + 1}.png", mime, content))
        fields = {
            "model": api.get("modelName") or model,
            "prompt": prompt,
            "n": int(body.get("imageCount") or 1),
            "size": image_size(body.get("ratio") or "16:9", body.get("quality") or "2k"),
        }
        data, boundary = multipart_body(fields, files)
        req = urllib.request.Request(
            image_edit_endpoint(api),
            data=data,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                result = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"图生图编辑接口失败 HTTP {exc.code}: {detail[:500]}") from exc
        output_path = extract_image_result(result, "image_edit")
        return {"url": public_url(output_path), "raw": result, "model": fields["model"], "alias": model}

    payload = {
        "model": api.get("modelName") or model,
        "prompt": prompt,
        "n": int(body.get("imageCount") or 1),
        "size": image_size(body.get("ratio") or "16:9", body.get("quality") or "2k"),
    }
    if body.get("preset") and body.get("preset") != "默认":
        payload["prompt"] = f"{payload['prompt']}\nPreset: {body['preset']}"
    if refs:
        ref_urls = [data_url_for_local_asset(r.get("url") or "") for r in refs if r.get("url")]
        payload["references"] = ref_urls
        payload["reference_images"] = ref_urls
        payload["input_images"] = ref_urls

    req = urllib.request.Request(
        image_endpoint(api),
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Image API HTTP {exc.code}: {detail[:500]}") from exc

    output_path = extract_image_result(result, "image")

    return {"url": public_url(output_path), "raw": result, "model": payload["model"], "alias": model}


def video_provider(config: dict, body: dict | None = None) -> str:
    provider = (body or {}).get("videoProvider") or config.get("defaults", {}).get("videoProvider") or "maas"
    return "ark" if provider == "ark" else "maas"


def maas_model_name(config: dict) -> str:
    models = config.get("models", {}).get("video") or ["doubao-seedance-2.0"]
    return "doubao-seedance-2.0" if "doubao-seedance-2.0" in models else models[0]


def normalize_ark_base_url(value: str) -> str:
    base = (value or "https://ark.cn-beijing.volces.com/api/v3").strip().rstrip("/")
    if base.endswith("/contents/generations/tasks"):
        return base.rsplit("/contents/generations/tasks", 1)[0]
    return base


def ark_task_endpoint(base_url: str) -> str:
    return f"{normalize_ark_base_url(base_url)}/contents/generations/tasks"


def ark_request(method: str, url: str, api_key: str, payload: dict | None = None) -> dict:
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Ark API HTTP {exc.code}: {detail[:1000]}") from exc
    if not text:
        return {}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw": text}


def first_value(data: object, names: tuple[str, ...]) -> object:
    if isinstance(data, dict):
        for name in names:
            if name in data and data[name] not in (None, ""):
                return data[name]
        for value in data.values():
            found = first_value(value, names)
            if found not in (None, ""):
                return found
    if isinstance(data, list):
        for value in data:
            found = first_value(value, names)
            if found not in (None, ""):
                return found
    return None


def extract_remote_task_id(result: dict) -> str:
    value = first_value(result, ("task_id", "taskId", "id"))
    return str(value or "")


def extract_video_status(result: dict) -> str:
    status = first_value(result, ("status", "task_status", "state"))
    text = str(status or "").lower()
    if text in {"success", "succeeded", "done", "completed"}:
        return "succeeded"
    if text in {"fail", "failed", "error"}:
        return "failed"
    if text in {"queued", "pending", "created"}:
        return "queued"
    if text in {"running", "processing", "generating"}:
        return "running"
    return text or "running"


def extract_video_url(result: dict) -> str:
    value = first_value(result, ("video_url", "videoUrl", "url", "download_url", "downloadUrl"))
    if isinstance(value, str) and value.startswith(("http://", "https://")):
        return value
    return ""


def download_ark_video(url: str, task_id: str) -> str:
    output_path = OUTPUTS / f"{task_id}.mp4"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=600) as resp:
        output_path.write_bytes(resp.read())
    return public_url(output_path)


def ark_video_payload(request_data: dict, model: str) -> dict:
    payload = json.loads(json.dumps(request_data))
    payload["model"] = model
    return payload


def make_client(config: dict, model: str) -> MaasSeedanceClient:
    if MaasSeedanceClient is None:
        raise RuntimeError("maas_seedance package is not installed")
    maas = config["apis"]["maas"]
    client = MaasSeedanceClient(
        maas_base_url=maas["baseUrl"],
        maas_api_key=maas["apiKey"],
        maas_model=model,
        enable_video_encrypt=bool(maas.get("enableVideoEncrypt", True)),
    )
    public_key = ROOT / maas.get("publicKeyPath", "./tmp/seedance_pub.pem")
    private_key = ROOT / maas.get("privateKeyPath", "./tmp/seedance_priv.pem")
    client.set_video_file_encrypt_key(str(public_key), str(private_key))
    return client


def run_video_task(task_id: str, config: dict, request_data: dict, model: str, provider: str = "maas") -> None:
    TASKS[task_id]["status"] = "creating"
    try:
        if provider == "ark":
            ark = config.get("apis", {}).get("ark", {})
            api_key = (ark.get("apiKey") or "").strip()
            if not api_key:
                raise RuntimeError("火山算力 API Key 为空，请在设置里填写 ARK_API_KEY。")
            base_url = normalize_ark_base_url(ark.get("baseUrl") or ark.get("website") or "")
            payload = ark_video_payload(request_data, model)
            result = ark_request("POST", ark_task_endpoint(base_url), api_key, payload)
            remote_task_id = extract_remote_task_id(result)
            if not remote_task_id:
                raise RuntimeError(f"火山算力没有返回任务 ID：{json.dumps(result, ensure_ascii=False)[:1000]}")
            TASKS[task_id].update({
                "remoteTaskId": remote_task_id,
                "rawCreateResponse": result,
                "status": "running",
                "provider": "ark",
            })
            while True:
                time.sleep(8)
                info = ark_request("GET", f"{ark_task_endpoint(base_url)}/{remote_task_id}", api_key)
                TASKS[task_id]["remoteInfo"] = info
                status = extract_video_status(info)
                video_url = extract_video_url(info)
                if status == "succeeded":
                    local_url = download_ark_video(video_url, task_id) if video_url else ""
                    TASKS[task_id].update({
                        "status": "succeeded" if local_url else "failed",
                        "url": local_url or video_url,
                        "remoteUrl": video_url,
                        "error": "" if local_url or video_url else "火山任务成功，但没有找到视频下载地址",
                    })
                    return
                if status == "failed":
                    TASKS[task_id].update({"status": "failed", "error": json.dumps(info, ensure_ascii=False)[:1000]})
                    return
                TASKS[task_id]["status"] = status or "running"
            return
        client = make_client(config, model)
        remote_task_id = client.create_video_generation_task(request_data)
        TASKS[task_id].update({"remoteTaskId": remote_task_id, "status": "running"})
        if not remote_task_id:
            local_urls = local_reference_urls(request_data)
            error = (
                "参考素材是本地地址，远端 Seedance 服务访问不到。请改用公网图片/视频 URL，或先用纯文生视频。"
                if local_urls
                else "Seedance 没有返回任务 ID，请检查 API Key、模型映射、时长/比例参数或远端接口状态。"
            )
            TASKS[task_id].update({"status": "failed", "error": error, "localReferenceUrls": local_urls})
            return

        while True:
            time.sleep(8)
            info = client.query_video_generation_task(remote_task_id)
            TASKS[task_id]["remoteInfo"] = info
            status = info.get("status", "running")
            if status == "succeeded":
                output_path = OUTPUTS / f"{task_id}.mp4"
                ok = client.download_video(remote_task_id, str(output_path))
                TASKS[task_id].update(
                    {
                        "status": "succeeded" if ok else "failed",
                        "url": public_url(output_path) if ok else "",
                        "error": "" if ok else "Remote task succeeded, but download failed",
                    }
                )
                return
            if status == "failed":
                TASKS[task_id].update({"status": "failed", "error": json.dumps(info, ensure_ascii=False)})
                return
            TASKS[task_id]["status"] = status or "running"
    except Exception as exc:
        TASKS[task_id].update({"status": "failed", "error": str(exc)})


class Handler(BaseHTTPRequestHandler):
    server_version = "AICanvasStudio/0.1"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == "/api/config":
            self.send_json(load_config())
            return
        if path == "/api/tasks":
            self.send_json({"tasks": TASKS})
            return
        if path.startswith("/api/task/"):
            task_id = path.rsplit("/", 1)[-1]
            self.send_json(TASKS.get(task_id, {"status": "not_found"}))
            return
        self.serve_static(path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/config":
            body = self.read_json()
            save_config(deep_merge(DEFAULT_CONFIG, body))
            self.send_json({"ok": True, "config": load_config()})
            return
        if path == "/api/upload":
            self.handle_upload()
            return
        if path == "/api/generate":
            self.handle_generate()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def handle_generate(self) -> None:
        config = load_config()
        body = self.read_json()
        mode = body.get("mode") or body.get("type") or "t2v"
        prompt = body.get("prompt", "")
        provider = video_provider(config, body)
        model = body.get("model") or config["defaults"]["videoModel"]
        if provider == "maas":
            model = maas_model_name(config)
        elif provider == "ark":
            model = config.get("apis", {}).get("ark", {}).get("modelName") or "doubao-seedance-2-0-260"
        ratio = body.get("ratio") or config["defaults"]["ratio"]
        duration = int(body.get("duration") or config["defaults"]["duration"])
        resolution = body.get("resolution") or body.get("quality") or "720p"
        watermark = bool(body.get("watermark", config["defaults"]["watermark"]))
        generate_audio = bool(body.get("generateAudio", config["defaults"]["generateAudio"]))
        refs = body.get("references", [])

        if mode not in {"t2v", "i2v", "t2i", "i2i"}:
            self.send_json({"ok": False, "error": f"Unsupported generate mode: {mode}"}, status=HTTPStatus.BAD_REQUEST)
            return

        if mode in {"t2v", "i2v"}:
            content = [{"type": "text", "text": prompt}]
            for ref in refs:
                kind = ref.get("kind")
                url = ref.get("url")
                role = ref.get("role")
                if not url:
                    continue
                if kind == "image":
                    url = data_url_for_local_asset(url)
                    content.append({"type": "image_url", "image_url": {"url": url}, "role": role or "reference_image"})
                elif kind == "video":
                    content.append({"type": "video_url", "video_url": {"url": url}, "role": role or "reference_video"})
                elif kind == "audio":
                    content.append({"type": "audio_url", "audio_url": {"url": url}, "role": role or "reference_audio"})

            request_data = {
                "content": content,
                "generate_audio": generate_audio,
                "ratio": ratio,
                "duration": duration,
                "resolution": resolution,
                "watermark": watermark,
            }
            task_id = f"task_{uuid.uuid4().hex[:12]}"
            TASKS[task_id] = {
                "id": task_id,
                "status": "queued",
                "mode": mode,
                "model": model,
                "videoProvider": provider,
                "request": compact_request_for_task(request_data),
                "createdAt": time.time(),
            }
            thread = threading.Thread(target=run_video_task, args=(task_id, config, request_data, model, provider), daemon=True)
            thread.start()
            self.send_json({"ok": True, "taskId": task_id, "request": request_data})
            return

        payload = {
            "mode": mode,
            "model": body.get("model") or config["defaults"]["imageModel"],
            "prompt": prompt,
            "references": refs,
            "ratio": body.get("ratio"),
            "quality": body.get("quality"),
            "imageCount": body.get("imageCount"),
            "preset": body.get("preset"),
        }
        try:
            result = generate_image(config, payload)
            self.send_json({"ok": True, "url": result["url"], "model": result.get("model"), "alias": result.get("alias")})
        except Exception as exc:
            self.send_json({"ok": False, "error": str(exc), "payload": payload}, status=HTTPStatus.BAD_GATEWAY)

    def handle_upload(self) -> None:
        ctype = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in ctype:
            self.send_error(HTTPStatus.BAD_REQUEST, "multipart/form-data required")
            return
        boundary_match = re.search(r"boundary=(.+)", ctype)
        if not boundary_match:
            self.send_error(HTTPStatus.BAD_REQUEST, "boundary missing")
            return
        boundary = boundary_match.group(1).strip('"').encode()
        length = int(self.headers.get("Content-Length", "0"))
        data = self.rfile.read(length)
        marker = b"--" + boundary
        files = []
        for part in data.split(marker):
            if b"filename=" not in part:
                continue
            head, _, body = part.partition(b"\r\n\r\n")
            if not body:
                continue
            headers = head.decode("utf-8", errors="ignore")
            filename_match = re.search(r'filename="([^"]*)"', headers)
            if not filename_match:
                continue
            filename = safe_name(filename_match.group(1))
            content = body.rstrip(b"\r\n-")
            path = UPLOADS / f"{uuid.uuid4().hex[:8]}_{filename}"
            path.write_bytes(content)
            mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            kind = "image" if mime.startswith("image/") else "video" if mime.startswith("video/") else "audio" if mime.startswith("audio/") else "file"
            files.append({"name": filename, "url": public_url(path), "mime": mime, "kind": kind})
        self.send_json({"ok": True, "files": files})

    def serve_static(self, path: str) -> None:
        if path == "/":
            path = "/index.html"
        root = ROOT if path.startswith(("/uploads/", "/outputs/")) else PUBLIC
        target = (root / path.lstrip("/")).resolve()
        if not str(target).startswith(str(root.resolve())) or not target.exists() or target.is_dir():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(target.stat().st_size))
        self.end_headers()
        with target.open("rb") as f:
            shutil.copyfileobj(f, self.wfile)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def send_json(self, data: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")


def main() -> None:
    port = int(os.environ.get("AI_CANVAS_PORT", "7863"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"AI Canvas Studio running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()


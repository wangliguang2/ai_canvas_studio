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

import requests

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
        "kling": {
            "baseUrl": "https://api.klingai.com/v1",
            "apiKey": "",
            "website": "https://app.klingai.com",
            "modelName": "kling-v1-6",
        },
        "happyhorse": {
            "baseUrl": "https://api.happyhorse.com/v1",
            "apiKey": "",
            "website": "https://happyhorse.com",
            "modelName": "happyhorse-video",
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
        "seedream": {
            "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
            "apiKey": "",
            "website": "https://ark.cn-beijing.volces.com",
            "modelName": "seedream-5-0-pro",
        },
        "i2i": {
            "baseUrl": "",
            "apiKey": "",
            "website": "",
            "modelName": "",
            "endpointType": "openai-edits",
            "referenceField": "image",
            "identityPrompt": "Use the provided reference image as the strict identity and visual anchor. Preserve the original person or subject, face, age, hairstyle, body shape, clothing identity, and core visual features. Do not replace the referenced subject with a different person or object. Only change the scene, camera, lighting, pose, layout, or style requested by the user.",
        },
        "multimodal": {
            "baseUrl": "https://www.dmxapi.cn/v1/responses",
            "apiKey": "",
            "website": "https://www.dmxapi.cn",
            "submitModel": "doubao-seedance-2-0-260128",
            "queryModel": "seedance-2-0-get",
            "requestFormat": "Responses JSON 多模态",
            "authMode": "bearer",
            "resolution": "4K",
            "ratio": "16:9",
            "duration": 8,
            "watermark": False,
            "returnLastFrame": False,
            "webSearch": False,
        },
        "agent": {
            "baseUrl": "https://api.openai.com/v1",
            "apiKey": "",
            "modelName": "gpt-4.1-mini",
            "visionModel": "gpt-4.1-mini",
            "promptModel": "deepseek-chat",
        },
        "llmVendors": {
            "doubao": {
                "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
                "apiKey": "",
                "modelName": "doubao-1-5-pro-32k",
                "note": "https://console.volcengine.com/ark",
            },
            "qwen": {
                "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
                "apiKey": "",
                "modelName": "qwen-plus",
                "note": "https://bailian.console.aliyun.com",
            },
            "deepseek": {
                "baseUrl": "https://api.deepseek.com/v1",
                "apiKey": "",
                "modelName": "deepseek-chat",
                "note": "https://platform.deepseek.com",
            },
            "kimi": {
                "baseUrl": "https://api.moonshot.cn/v1",
                "apiKey": "",
                "modelName": "moonshot-v1-8k",
                "note": "https://platform.moonshot.cn",
            },
            "zhipu": {
                "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
                "apiKey": "",
                "modelName": "glm-4-flash",
                "note": "https://open.bigmodel.cn",
            },
        },
    },
    "models": {
        "video": ["doubao-seedance-2-0-260"],
        "image": ["banana", "image2", "seedream"],
    },
    "defaults": {
        "videoModel": "doubao-seedance-2-0-260",
        "videoProvider": "ark",
        "agentProvider": "zhipu",
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
    apis.setdefault("kling", {})
    apis.setdefault("happyhorse", {})
    apis.setdefault("banana", {})
    apis.setdefault("image2", {})
    apis.setdefault("seedream", {})
    apis.setdefault("i2i", {})
    apis.setdefault("multimodal", {})
    apis.setdefault("agent", {})
    apis.setdefault("llmVendors", {})
    defaults = config.setdefault("defaults", {})
    models = config.setdefault("models", {})
    ark = apis["ark"]
    defaults["videoProvider"] = "ark"
    ark.setdefault("baseUrl", "https://ark.cn-beijing.volces.com/api/v3")
    ark.setdefault("website", "https://ark.cn-beijing.volces.com")
    ark.setdefault("modelName", "doubao-seedance-2-0-260")
    defaults["videoModel"] = ark.get("modelName") or "doubao-seedance-2-0-260"
    kling = apis["kling"]
    kling.setdefault("baseUrl", "https://api.klingai.com/v1")
    kling.setdefault("website", "https://app.klingai.com")
    kling.setdefault("modelName", "kling-v1-6")
    happyhorse = apis["happyhorse"]
    happyhorse.setdefault("baseUrl", "https://api.happyhorse.com/v1")
    happyhorse.setdefault("website", "https://happyhorse.com")
    happyhorse.setdefault("modelName", "happyhorse-video")
    seedream = apis["seedream"]
    seedream.setdefault("baseUrl", "https://ark.cn-beijing.volces.com/api/v3")
    seedream.setdefault("website", "https://ark.cn-beijing.volces.com")
    seedream.setdefault("modelName", "seedream-5-0-pro")
    models["video"] = [ark.get("modelName") or "doubao-seedance-2-0-260", kling.get("modelName") or "kling-v1-6", happyhorse.get("modelName") or "happyhorse-video"]
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
    models["image"] = models.get("image") or ["banana", "image2", "seedream"]
    for model_name in ("banana", "image2", "seedream"):
        if model_name not in models["image"]:
            models["image"].append(model_name)
    i2i = apis["i2i"]
    i2i.setdefault("endpointType", "openai-edits")
    i2i.setdefault("referenceField", "image")
    i2i.setdefault("modelName", "")
    i2i.setdefault("identityPrompt", DEFAULT_CONFIG["apis"]["i2i"]["identityPrompt"])
    multimodal = apis["multimodal"]
    multimodal.setdefault("baseUrl", "https://www.dmxapi.cn/v1/responses")
    multimodal.setdefault("website", "https://www.dmxapi.cn")
    multimodal.setdefault("submitModel", "doubao-seedance-2-0-260128")
    multimodal.setdefault("queryModel", "seedance-2-0-get")
    multimodal.setdefault("requestFormat", "Responses JSON 多模态")
    multimodal.setdefault("authMode", "bearer")
    multimodal.setdefault("resolution", "4K")
    multimodal.setdefault("ratio", "16:9")
    multimodal.setdefault("duration", 8)
    multimodal.setdefault("watermark", False)
    multimodal.setdefault("returnLastFrame", False)
    multimodal.setdefault("webSearch", False)
    agent = apis["agent"]
    agent.setdefault("baseUrl", "https://api.openai.com/v1")
    agent.setdefault("apiKey", "")
    agent.setdefault("modelName", "gpt-4.1-mini")
    agent.setdefault("visionModel", "gpt-4.1-mini")
    agent.setdefault("promptModel", "deepseek-chat")
    vendors = apis["llmVendors"]
    for key, defaults_vendor in DEFAULT_CONFIG["apis"]["llmVendors"].items():
        vendor = vendors.setdefault(key, {})
        for field, value in defaults_vendor.items():
            vendor.setdefault(field, value)


def deep_merge(base: dict, patch: dict) -> dict:
    merged = json.loads(json.dumps(base))
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def strip_secret_keys(config: dict) -> dict:
    clean = json.loads(json.dumps(config))
    apis = clean.get("apis") or {}
    for value in apis.values():
        if isinstance(value, dict) and "apiKey" in value:
            value["apiKey"] = ""
    vendors = apis.get("llmVendors") or {}
    for value in vendors.values():
        if isinstance(value, dict):
            value["apiKey"] = ""
    return clean


def save_config(config: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(strip_secret_keys(config), ensure_ascii=False, indent=2), encoding="utf-8")


def provider_root(api: dict) -> str:
    raw = (api.get("website") or api.get("baseUrl") or "").strip().rstrip("/")
    if not raw:
        return ""
    parsed = urlparse(raw)
    if not parsed.scheme or not parsed.netloc:
        return raw
    path = parsed.path.rstrip("/")
    if "/v1" in path:
        path = path.split("/v1", 1)[0]
    return f"{parsed.scheme}://{parsed.netloc}{path}".rstrip("/")


def provider_v1_root(api: dict) -> str:
    base = (api.get("baseUrl") or "").strip().rstrip("/")
    website = (api.get("website") or "").strip().rstrip("/")
    root = base or website
    if not root:
        return ""
    if "/v1" in root:
        return root.split("/v1", 1)[0].rstrip("/") + "/v1"
    return root.rstrip("/") + "/v1"


def find_balance_value(data) -> float | None:
    if isinstance(data, (int, float)):
        return float(data)
    if isinstance(data, str):
        try:
            return float(data.replace(",", "").strip())
        except ValueError:
            return None
    if isinstance(data, list):
        for item in data:
            value = find_balance_value(item)
            if value is not None:
                return value
        return None
    if not isinstance(data, dict):
        return None
    for key in (
        "total_available",
        "available_amount",
        "available_balance",
        "available_quota",
        "available",
        "balance",
        "cash_balance",
        "total_balance",
        "credit",
        "credits",
        "quota",
        "left_quota",
        "remain",
        "remaining",
        "remaining_amount",
        "remaining_balance",
        "remaining_quota",
        "amount",
        "money",
        "value",
    ):
        if key in data:
            value = find_balance_value(data.get(key))
            if value is not None:
                return value
    for key in ("data", "result", "account", "wallet", "billing", "grant", "grants", "user", "profile", "token"):
        if key in data:
            value = find_balance_value(data.get(key))
            if value is not None:
                return value
    return None


def query_provider_balance(name: str, api: dict) -> dict:
    api_key = (api.get("apiKey") or "").strip()
    if not api_key:
        return {"ok": False, "error": "missing_key", "message": "API Key 未配置"}
    root = provider_root(api)
    v1 = provider_v1_root(api)
    candidates = []
    if v1:
        candidates.extend([
            f"{v1}/dashboard/billing/credit_grants",
            f"{v1}/dashboard/billing/usage",
            f"{v1}/billing/credit_grants",
            f"{v1}/credit_grants",
            f"{v1}/balance",
            f"{v1}/user/balance",
            f"{v1}/user/info",
            f"{v1}/account/balance",
        ])
    if root:
        candidates.extend([
            f"{root}/dashboard/billing/credit_grants",
            f"{root}/dashboard/billing/usage",
            f"{root}/api/user/balance",
            f"{root}/api/v1/user/balance",
            f"{root}/api/v1/user/info",
            f"{root}/api/user/self",
            f"{root}/api/balance",
            f"{root}/api/account/balance",
            f"{root}/api/token",
            f"{root}/console/token",
        ])
    seen = set()
    errors = []
    for url in candidates:
        if not url or url in seen:
            continue
        seen.add(url)
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "AI-Canvas-Studio/0.1",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
            data = json.loads(raw)
            balance = find_balance_value(data)
            if balance is not None:
                return {"ok": True, "balance": balance, "source": url, "provider": name}
            errors.append(f"{url}: 未找到余额字段")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:220]
            errors.append(f"{url}: HTTP {exc.code} {detail}")
        except Exception as exc:
            errors.append(f"{url}: {exc}")
    return {
        "ok": False,
        "error": "query_failed",
        "message": errors[-1] if errors else "没有可用余额接口",
        "provider": name,
    }


def active_balance_sources(config: dict) -> tuple[tuple[str, dict], tuple[str, dict]]:
    apis = config.get("apis", {})
    image_api = apis.get("image2") or apis.get("banana") or {}
    if not (image_api.get("apiKey") or "").strip() and (apis.get("i2i") or {}).get("apiKey"):
        image_api = apis.get("i2i") or image_api
    video_api = apis.get("ark") or {}
    video_name = "ark"
    if not (video_api.get("apiKey") or "").strip() and (apis.get("multimodal") or {}).get("apiKey"):
        video_api = apis.get("multimodal") or video_api
        video_name = "multimodal"
    return ("image", image_api), (video_name, video_api)


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


def gpt_image_2_size(ratio: str, quality: str) -> str:
    level = str(quality or "2k").lower()
    if level == "4k":
        mapping = {
            "1:1": "2048x2048",
            "16:9": "3840x2160",
            "9:16": "2160x3840",
            "4:3": "2048x1152",
            "3:4": "1024x1536",
        }
    else:
        mapping = {
            "1:1": "1024x1024" if level == "1k" else "2048x2048",
            "16:9": "2048x1152",
            "9:16": "1024x1536",
            "4:3": "1536x1024",
            "3:4": "1024x1536",
        }
    return mapping.get(ratio, mapping["16:9"])


def is_openai_official_image_api(api: dict) -> bool:
    root = str(api.get("website") or api.get("baseUrl") or "").lower()
    return "api.openai.com" in root


def is_openai_gpt_image_model(api: dict) -> bool:
    return is_openai_official_image_api(api) and str(api.get("modelName") or "").lower().startswith("gpt-image-")


def is_dmx_gpt_image_model(api: dict) -> bool:
    root = str(api.get("website") or api.get("baseUrl") or "").lower()
    return "dmxapi.cn" in root and str(api.get("modelName") or "").lower().startswith("gpt-image-2")


def openai_image_size(ratio: str) -> str:
    return {
        "1:1": "1024x1024",
        "16:9": "1536x1024",
        "4:3": "1536x1024",
        "9:16": "1024x1536",
        "3:4": "1024x1536",
    }.get(ratio, "auto")


def openai_image_quality(quality: str) -> str:
    return {"1k": "low", "2k": "medium", "4k": "high"}.get(str(quality or "2k").lower(), "auto")


def image_size_for_api(api: dict, ratio: str, quality: str) -> str:
    if is_openai_gpt_image_model(api):
        return openai_image_size(ratio)
    if is_dmx_gpt_image_model(api) or str(api.get("modelName") or "").lower() == "gpt-image-2":
        return gpt_image_2_size(ratio, quality)
    return image_size(ratio, quality)


def ratio_prompt_prefix(ratio: str) -> str:
    return {
        "16:9": "横版 16:9",
        "9:16": "竖屏 9:16",
        "1:1": "1:1 方形构图",
        "4:3": "4:3",
        "3:4": "3:4",
    }.get(ratio, "横版 16:9")


def is_gpt_image_2_all(api: dict) -> bool:
    return str(api.get("modelName") or "").lower() == "gpt-image-2-all"


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


def post_multipart_with_requests(url: str, api_key: str, fields: dict, files: list[tuple[str, str, str, bytes]]) -> dict:
    request_files = []
    try:
        for field, filename, mime, content in files:
            request_files.append((field, (safe_name(filename), content, mime)))
        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            data=fields,
            files=request_files,
            timeout=180,
        )
        if response.status_code >= 400:
            debug = {
                "url": url,
                "fieldNames": list(fields.keys()),
                "fileFields": [item[0] for item in request_files],
                "fileNames": [item[1][0] for item in request_files],
                "fileMimes": [item[1][2] for item in request_files],
                "fileSizes": [len(item[1][1]) for item in request_files],
            }
            raise RuntimeError(f"HTTP {response.status_code}: {response.text[:500]} | sent={json.dumps(debug, ensure_ascii=False)}")
        return response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"HTTP request failed: {exc}") from exc
    except ValueError as exc:
        raise RuntimeError("Image API response is not valid JSON") from exc


def dmx_image_quality(quality: str) -> str:
    return {"1k": "low", "2k": "medium", "4k": "high"}.get(str(quality or "2k").lower(), "low")


def image_edit_reference_files(refs: list[dict]) -> list[tuple[str, str, bytes]]:
    ref_files: list[tuple[str, str, bytes]] = []
    for index, ref in enumerate(refs):
        ref_url = data_url_for_local_asset(ref.get("url") or "")
        if not ref_url:
            continue
        content, mime, filename = image_bytes_from_url(ref_url)
        ref_files.append((filename or f"reference_{index + 1}.png", mime, content))
    return ref_files


def generate_image_edit(config: dict, body: dict) -> dict:
    api = config.get("apis", {}).get("i2i", {})
    api_key = (api.get("apiKey") or "").strip()
    model_name = (api.get("modelName") or "").strip()
    if not api_key:
        raise RuntimeError("图生图 API Key 未填写。请打开设置里的“图生图专用 / 角色保持”填写。")
    if not model_name:
        raise RuntimeError("图生图模型 ID 未填写。DMXAPI 可填 gpt-image-2-ssvip。")

    refs = body.get("references") or []
    if not refs:
        raise RuntimeError("图生图没有收到参考图。请把图片节点右侧输出点连接到图生图节点左侧输入点，或在图生图节点里添加参考图。")
    ref_files = image_edit_reference_files(refs)
    if not ref_files:
        raise RuntimeError("图生图没有收到有效参考图。请重新连接图片节点，或在图生图节点里重新添加参考图。")

    prompt = (body.get("prompt") or "").strip()
    identity_prompt = (api.get("identityPrompt") or "").strip()
    if identity_prompt:
        prompt = f"{identity_prompt}\n\n{prompt}"
    if not prompt:
        raise RuntimeError("图生图提示词为空。")

    fields = {
        "model": model_name,
        "prompt": prompt,
        "size": image_size_for_api(api, body.get("ratio") or "16:9", body.get("quality") or "2k"),
        "background": "auto",
        "output_format": "jpeg",
        "quality": dmx_image_quality(body.get("quality") or "2k"),
        "n": "1",
    }
    filename, mime, content = ref_files[0]
    files = [("image", filename, mime, content)]
    result = post_multipart_with_requests(image_edit_endpoint(api), api_key, fields, files)
    output_path = extract_image_result(result, "image_edit")
    return {
        "url": public_url(output_path),
        "raw": result,
        "model": model_name,
        "alias": "i2i",
        "imageField": "image",
    }


def normalize_image_reference_field(field_name: str, api: dict) -> str:
    field = (field_name or "image").strip() or "image"
    model = str(api.get("modelName") or "").lower()
    if field.lower() in {"image2", "gpt-image-2", "gpt-image-2-vip"}:
        field = "image"
    if is_dmx_gpt_image_model(api):
        return "image"
    if model in {"gpt-image-2-vip"} and field == "image" and "api.openai.com" not in str(api.get("website") or api.get("baseUrl") or "").lower():
        return "image.items"
    return field


def image_reference_field_candidates(field_name: str, api: dict) -> list[str]:
    model = str(api.get("modelName") or "").lower()
    fields = [normalize_image_reference_field(field_name, api)]
    if is_dmx_gpt_image_model(api):
        fields.extend(["image"])
    elif is_openai_gpt_image_model(api):
        fields.extend(["image[]", "image"])
    elif model in {"gpt-image-2", "gpt-image-2-vip"}:
        fields.extend(["image", "image.items", "image[]", "images"])
    else:
        fields.extend(["image", "image[]"])
    unique: list[str] = []
    for field in fields:
        if field and field not in unique:
            unique.append(field)
    return unique


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
    is_i2i = body.get("mode") == "i2i"
    if is_i2i:
        return generate_image_edit(config, body)
    model = body.get("model") or "image2"
    if model == "i2i":
        model = "image2"
    i2i_api = config["apis"].get("i2i", {})
    use_i2i_api = is_i2i and bool((i2i_api.get("apiKey") or "").strip() and (i2i_api.get("modelName") or "").strip())
    api = i2i_api if use_i2i_api else config["apis"].get(model, {})
    if use_i2i_api:
        model = "i2i"
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
    if is_gpt_image_2_all(api):
        prefix = ratio_prompt_prefix(body.get("ratio") or "16:9")
        if prefix and not prompt.strip().startswith(prefix):
            prompt = f"{prefix}，{prompt}"
    if is_i2i and not refs:
        raise RuntimeError("图生图没有收到参考图。请把图片节点右侧输出点连接到图生图节点左侧输入点，或点击图生图节点里的“添加”上传参考图。")
    if is_i2i and refs:
        identity_prompt = (config["apis"].get("i2i", {}).get("identityPrompt") or DEFAULT_CONFIG["apis"]["i2i"]["identityPrompt"]).strip()
        prompt = f"{identity_prompt}\n\nUser prompt: {prompt}"

        field_names = image_reference_field_candidates(
            api.get("referenceField") or config["apis"].get("i2i", {}).get("referenceField") or "image",
            api,
        )
        ref_files = []
        for index, ref in enumerate(refs):
            ref_url = data_url_for_local_asset(ref.get("url") or "")
            if not ref_url:
                continue
            content, mime, filename = image_bytes_from_url(ref_url)
            ref_files.append((filename or f"reference_{index + 1}.png", mime, content))
        if not ref_files:
            raise RuntimeError("图生图没有收到有效参考图。请重新连接图片节点，或在图生图节点里重新添加参考图。")
        result = None
        last_detail = ""
        last_code = ""
        used_field = field_names[0]
        for field_name in field_names:
            files = [(field_name, filename, mime, content) for filename, mime, content in ref_files]
            fields = {
                "model": api.get("modelName") or model,
                "prompt": prompt,
            }
            if field_name.endswith(".items"):
                fields.setdefault(field_name.rsplit(".", 1)[0], "reference")
            if is_gpt_image_2_all(api):
                fields["response_format"] = "url"
            else:
                if not is_openai_gpt_image_model(api):
                    fields["n"] = int(body.get("imageCount") or 1)
                fields["size"] = image_size_for_api(api, body.get("ratio") or "16:9", body.get("quality") or "2k")
            if is_openai_gpt_image_model(api):
                fields.update({
                    "quality": openai_image_quality(body.get("quality") or "2k"),
                    "output_format": "jpeg",
                    "background": "auto",
                    "moderation": "auto",
                })
            elif is_dmx_gpt_image_model(api):
                fields.update({
                    "quality": "auto",
                    "output_format": "jpeg",
                    "background": "auto",
                    "moderation": "auto",
                })
            elif str(api.get("modelName") or "").lower() == "gpt-image-2":
                fields.update({
                    "quality": "auto",
                    "format": "jpeg",
                    "background": "auto",
                    "moderation": "auto",
                })
            data, boundary = multipart_body(fields, files)
            try:
                if is_dmx_gpt_image_model(api):
                    result = post_multipart_with_requests(image_edit_endpoint(api), api_key, fields, files)
                else:
                    req = urllib.request.Request(
                        image_edit_endpoint(api),
                        data=data,
                        headers={
                            "Content-Type": f"multipart/form-data; boundary={boundary}",
                            "Authorization": f"Bearer {api_key}",
                        },
                        method="POST",
                    )
                    with urllib.request.urlopen(req, timeout=180) as resp:
                        result = json.loads(resp.read().decode("utf-8"))
                used_field = field_name
                break
            except urllib.error.HTTPError as exc:
                last_code = str(exc.code)
                last_detail = exc.read().decode("utf-8", errors="ignore")
                if exc.code in {400, 422, 500} and "image is required" in last_detail.lower():
                    continue
                raise RuntimeError(f"图生图编辑接口失败 HTTP {exc.code}: {last_detail[:500]}") from exc
            except RuntimeError as exc:
                last_detail = str(exc)
                last_code = "request"
                if "image is required" in last_detail.lower():
                    continue
                raise RuntimeError(f"图生图编辑接口失败: {last_detail[:500]}") from exc
        if result is None:
            tried = ", ".join(field_names)
            raise RuntimeError(f"图生图编辑接口失败 HTTP {last_code}: 接口始终提示 image is required。已尝试字段：{tried}。原始错误：{last_detail[:300]}")
        output_path = extract_image_result(result, "image_edit")
        return {"url": public_url(output_path), "raw": result, "model": api.get("modelName") or model, "alias": model, "imageField": used_field}

    payload = {
        "model": api.get("modelName") or model,
        "prompt": prompt,
    }
    if is_gpt_image_2_all(api):
        payload["response_format"] = "url"
    else:
        if not is_openai_gpt_image_model(api):
            payload["n"] = int(body.get("imageCount") or 1)
        payload["size"] = image_size_for_api(api, body.get("ratio") or "16:9", body.get("quality") or "2k")
    if is_openai_gpt_image_model(api):
        payload["quality"] = openai_image_quality(body.get("quality") or "2k")
        payload["output_format"] = "jpeg"
    elif is_dmx_gpt_image_model(api):
        payload["quality"] = "auto"
        payload["output_format"] = "jpeg"
        payload["background"] = "auto"
        payload["moderation"] = "auto"
    elif str(api.get("modelName") or "").lower() == "gpt-image-2":
        payload["quality"] = "low"
        payload["format"] = "jpeg"
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
    return "ark"


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


def agent_endpoint(base_url: str) -> str:
    root = (base_url or "https://api.openai.com/v1").strip().rstrip("/")
    if root.endswith("/chat/completions") or root.endswith("/responses"):
        return root
    if re.search(r"/(?:api/)?v\d+$", root):
        return f"{root}/chat/completions"
    return f"{root}/v1/chat/completions"


def call_agent_model(config: dict, body: dict) -> dict:
    override = body.get("agentOverride") or {}
    agent = config.get("apis", {}).get("agent", {})
    if isinstance(override, dict) and (override.get("apiKey") or override.get("baseUrl") or override.get("modelName")):
        agent = {**agent, **override}
    api_key = (agent.get("apiKey") or "").strip()
    if not api_key:
        raise ValueError("当前智能体模型的 API Key 为空。请在设置里填写对应厂家或智能体板块的 Key。")
    model = body.get("model") or agent.get("modelName") or "gpt-4.1-mini"
    skill = body.get("skill") or {}
    refs = body.get("references") or []
    ref_text = ""
    if refs:
        lines = [f"@{ref.get('index', '')} {ref.get('name') or '参考图'}" for ref in refs]
        ref_text = "\n\n参考图：\n" + "\n".join(lines)
    system_parts = [
        "你是 AI 画布里的创作智能体，负责拆解需求、改写提示词、规划节点和给出可执行步骤。",
        f"运行模式：{body.get('runMode') or 'ask'}",
        "当用户要求“一套资产图、资产图放到画布、链接生图节点、用 image2 出图”时，请直接输出多条资产提示词，每条使用格式：资产图1：名称｜提示词内容。名称尽量写成角色、场景、道具或具体资产名；不要输出需求拆解、节点规划、操作步骤或确认步骤。",
    ]
    if skill.get("name"):
        system_parts.append(f"当前 Skill：{skill.get('name')}")
    if skill.get("content"):
        system_parts.append(f"Skill 内容：\n{skill.get('content')}")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "\n\n".join(system_parts)},
            {"role": "user", "content": f"{body.get('prompt') or ''}{ref_text}"},
        ],
        "temperature": 0.7,
    }
    endpoint = agent_endpoint(agent.get("baseUrl") or "https://api.openai.com/v1")
    res = requests.post(
        endpoint,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    try:
        data = res.json()
    except Exception:
        data = {"error": res.text}
    if not res.ok:
        err = data.get("error", {})
        message = err.get("message") if isinstance(err, dict) else err
        detail = message or f"Agent HTTP {res.status_code}"
        raise RuntimeError(f"{detail}\n请求地址：{endpoint}\n模型：{model}")
    text = (((data.get("choices") or [{}])[0].get("message") or {}).get("content")) or data.get("output_text") or ""
    return {"ok": True, "text": text, "model": model, "raw": data}


class Handler(BaseHTTPRequestHandler):
    server_version = "AICanvasStudio/0.1"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == "/api/config":
            self.send_json(load_config())
            return
        if path == "/api/balances":
            config = load_config()
            image_source, video_source = active_balance_sources(config)
            self.send_json({
                "image": query_provider_balance(*image_source),
                "video": query_provider_balance(*video_source),
                "updatedAt": time.time(),
            })
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
        if path == "/api/agent":
            self.handle_agent()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def handle_agent(self) -> None:
        body = self.read_json()
        config = deep_merge(load_config(), body.get("clientConfig") or {})
        try:
            self.send_json(call_agent_model(config, body))
        except ValueError as exc:
            self.send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as exc:
            self.send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)

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
        resolution = body.get("resolution") or body.get("quality") or "4K"
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






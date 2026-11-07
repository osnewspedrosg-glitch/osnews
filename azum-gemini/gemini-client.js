import { FREE_MODEL } from "./policy.js";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function buildGeminiRequest({ model = FREE_MODEL, system, contents }) {
  if (model !== FREE_MODEL) {
    throw new Error("model-not-on-free-allowlist");
  }
  return {
    url: `${ENDPOINT}/${model}:generateContent`,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  };
}

export function classifyUpstream(status, bodyText) {
  const body = String(bodyText ?? "");
  if (status === 429 || /RESOURCE_EXHAUSTED/.test(body)) return "gemini_quota";
  if (
    status === 402 ||
    /billing|paid service|payment required|user location is not supported|only available on the paid/i.test(body)
  ) {
    return "gemini_not_free";
  }
  if (status === 403) return "gemini_not_free";
  return "gemini_error";
}

export async function generateTurn({ fetchImpl, apiKey, model, system, contents, timeoutMs }) {
  const request = buildGeminiRequest({ model, system, contents });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(request.url, {
      ...request.init,
      headers: {
        ...request.init.headers,
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
    });
    const raw = await response.text();
    if (!response.ok) {
      return { ok: false, code: classifyUpstream(response.status, raw), upstreamStatus: response.status };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, code: "gemini_error", upstreamStatus: response.status };
    }
    if (parsed?.promptFeedback?.blockReason) {
      return { ok: false, code: "gemini_blocked", upstreamStatus: response.status };
    }
    const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((part) => part?.text ?? "").join("").trim();
    if (!text) return { ok: false, code: "gemini_empty", upstreamStatus: response.status };
    return { ok: true, code: "ok", text: text.slice(0, 4000), upstreamStatus: response.status };
  } catch (error) {
    if (error?.name === "AbortError") return { ok: false, code: "gemini_timeout" };
    return { ok: false, code: "gemini_error" };
  } finally {
    clearTimeout(timer);
  }
}

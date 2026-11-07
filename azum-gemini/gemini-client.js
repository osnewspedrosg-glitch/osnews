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

export function readUsage(parsed) {
  const usage = parsed?.usageMetadata;
  if (!usage || typeof usage !== "object") return null;
  const fields = ["promptTokenCount", "candidatesTokenCount", "thoughtsTokenCount"];
  if (!fields.every((field) => Number.isInteger(usage[field]) && usage[field] >= 0)) return null;
  return {
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    thinkingTokens: usage.thoughtsTokenCount,
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
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    const usage = readUsage(parsed);
    if (!response.ok) {
      return { ok: false, code: classifyUpstream(response.status, raw), upstreamStatus: response.status, usage };
    }
    if (!parsed) return { ok: false, code: "gemini_error", upstreamStatus: response.status, usage: null };
    if (parsed?.promptFeedback?.blockReason) {
      return { ok: false, code: "gemini_blocked", upstreamStatus: response.status, usage };
    }
    const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((part) => part?.text ?? "").join("").trim();
    if (!text) return { ok: false, code: "gemini_empty", upstreamStatus: response.status, usage };
    return { ok: true, code: "ok", text: text.slice(0, 4000), upstreamStatus: response.status, usage };
  } catch (error) {
    if (error?.name === "AbortError") return { ok: false, code: "gemini_timeout" };
    return { ok: false, code: "gemini_error" };
  } finally {
    clearTimeout(timer);
  }
}

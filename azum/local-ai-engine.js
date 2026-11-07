/**
 * Browser-side Qwen loader. The heavy WebAssembly session runs in the
 * runtime's own worker when proxy mode is available. Questions stay here.
 */
const RUNTIME_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/+esm";
const MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";
const MODEL_REVISION = "22942cb7d7ba4cc81bb4673549ca4d4614469b5e";
export const CACHE_KEY = "azum-local-ai-qwen2.5-0.5b-uint8";
const MAX_NEW_TOKENS = 48;
const MAX_PROMPT_CHARS = 400;
const KNOWN_FILES = [
  "added_tokens.json",
  "config.json",
  "generation_config.json",
  "merges.txt",
  "onnx/model_uint8.onnx",
  "quantize_config.json",
  "special_tokens_map.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "vocab.json",
];

let generator = null;
let loading = null;
let stopRequested = false;
const history = [];

function summarizeProgress(update) {
  if (!update || typeof update !== "object") return { status: "progress" };
  return {
    status: String(update.status ?? "progress"),
    file: String(update.file ?? update.name ?? "").slice(0, 120),
    progress: Number.isFinite(update.progress) ? update.progress : null,
  };
}

async function storeWithoutVary(cache, url, response) {
  const headers = new Headers(response.headers);
  headers.delete("vary");
  await cache.put(url, new Response(await response.blob(), { status: response.status, headers }));
}

async function warmKnownFiles() {
  const cache = await caches.open(CACHE_KEY);
  const existing = await cache.keys();
  for (const request of existing) {
    const found = await cache.match(request, { ignoreVary: true });
    if (!found || !found.headers.has("vary")) continue;
    await storeWithoutVary(cache, request, found);
  }
  for (const file of KNOWN_FILES) {
    const url = `https://huggingface.co/${MODEL_ID}/resolve/${MODEL_REVISION}/${file}`;
    if (await cache.match(url)) continue;
    try {
      const response = await fetch(url);
      if (response.ok) await storeWithoutVary(cache, url, response);
    } catch {
      /* A cached copy may already exist under another key. The loader reports a real miss. */
    }
  }
}

async function loadGenerator(onProgress) {
  await warmKnownFiles();
  const { pipeline, env } = await import(RUNTIME_URL);
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;
  env.cacheKey = CACHE_KEY;
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? Math.min(2, navigator.hardwareConcurrency || 1) : 1;
    env.backends.onnx.wasm.proxy = true;
  }
  generator = await pipeline("text-generation", MODEL_ID, {
    dtype: "uint8",
    device: "wasm",
    revision: MODEL_REVISION,
    progress_callback: (update) => onProgress?.(summarizeProgress(update)),
  });
  env.allowRemoteModels = false;
}

export function load(onProgress) {
  if (!loading) {
    loading = loadGenerator(onProgress).catch((error) => {
      loading = null;
      generator = null;
      throw error;
    });
  }
  return loading;
}

function assistantText(output) {
  const generated = output?.[0]?.generated_text;
  if (Array.isArray(generated)) {
    const last = generated[generated.length - 1];
    return typeof last?.content === "string" ? last.content.trim() : "";
  }
  return typeof generated === "string" ? generated.trim() : "";
}

export async function ask(text, onChunk) {
  if (!generator) throw Object.assign(new Error("not-ready"), { code: "not-ready" });
  const prompt = String(text ?? "").trim().slice(0, MAX_PROMPT_CHARS);
  if (!prompt) throw Object.assign(new Error("empty"), { code: "empty-generation" });
  stopRequested = false;
  const messages = [
    { role: "system", content: "Responde en español, en una sola frase, y contesta a la pregunta. No eres un médico ni un banco." },
    ...history.flatMap((turn) => [
      { role: "user", content: turn.user },
      { role: "assistant", content: turn.assistant },
    ]),
    { role: "user", content: prompt },
  ];
  const { TextStreamer } = await import(RUNTIME_URL);
  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    callback_function: (chunk) => {
      if (stopRequested) throw new Error("stopped");
      if (chunk) onChunk?.(String(chunk).slice(0, 200));
    },
  });
  const output = await generator(messages, { max_new_tokens: MAX_NEW_TOKENS, do_sample: false, streamer });
  const textOut = assistantText(output);
  if (!textOut) throw Object.assign(new Error("empty"), { code: "empty-generation" });
  history.push({ user: prompt, assistant: textOut.slice(0, 240) });
  while (history.length > 2) history.shift();
  return textOut;
}

export function requestStop() {
  stopRequested = true;
}

export function resetHistory() {
  history.length = 0;
}

export function unload() {
  generator = null;
  loading = null;
  history.length = 0;
}

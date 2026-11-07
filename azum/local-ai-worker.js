/**
 * Loads Qwen in this browser and generates text here.
 * The question is not posted to a chat server. Weight files and the runtime
 * are fetched only after the page sends "load".
 */

const RUNTIME_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/+esm";
const MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";
const MODEL_REVISION = "22942cb7d7ba4cc81bb4673549ca4d4614469b5e";
const CACHE_KEY = "azum-local-ai-qwen2.5-0.5b-uint8";
const MAX_NEW_TOKENS = 48;
const MAX_PROMPT_CHARS = 400;

let generator = null;
let loading = null;
let stopRequested = false;
const history = [];

function post(message) {
  self.postMessage(message);
}

function summarizeProgress(update) {
  if (!update || typeof update !== "object") return { status: "progress" };
  return {
    status: String(update.status ?? "progress"),
    file: String(update.file ?? update.name ?? "").slice(0, 120),
    progress: Number.isFinite(update.progress) ? update.progress : null,
    loaded: Number.isFinite(update.loaded) ? update.loaded : null,
    total: Number.isFinite(update.total) ? update.total : null,
  };
}

async function loadModel() {
  const transformers = await import(RUNTIME_URL);
  const { pipeline, env } = transformers;
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;
  env.cacheKey = CACHE_KEY;
  if (env.backends?.onnx?.wasm) {
    const threads = self.crossOriginIsolated ? Math.min(2, self.navigator?.hardwareConcurrency || 1) : 1;
    env.backends.onnx.wasm.numThreads = threads;
    env.backends.onnx.wasm.proxy = false;
  }
  generator = await pipeline("text-generation", MODEL_ID, {
    dtype: "uint8",
    device: "wasm",
    revision: MODEL_REVISION,
    progress_callback: (update) => post({ type: "progress", progress: summarizeProgress(update) }),
  });
  env.allowRemoteModels = false;
}

function assistantText(output) {
  const generated = output?.[0]?.generated_text;
  if (Array.isArray(generated)) {
    const last = generated[generated.length - 1];
    return typeof last?.content === "string" ? last.content.trim() : "";
  }
  if (typeof generated === "string") return generated.trim();
  return "";
}

async function generate(text) {
  const prompt = String(text ?? "").trim().slice(0, MAX_PROMPT_CHARS);
  if (!prompt) throw new Error("empty");
  stopRequested = false;
  const messages = [
    {
      role: "system",
      content: "Responde en español, en una sola frase, y contesta a la pregunta. No eres un médico ni un banco.",
    },
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
      if (chunk) post({ type: "chunk", chunk: String(chunk).slice(0, 200) });
    },
  });
  const output = await generator(messages, {
    max_new_tokens: MAX_NEW_TOKENS,
    do_sample: false,
    streamer,
  });
  const textOut = assistantText(output);
  if (!textOut) throw new Error("empty");
  history.push({ user: prompt, assistant: textOut.slice(0, 240) });
  while (history.length > 2) history.shift();
  return textOut;
}

self.onmessage = (event) => {
  const message = event.data ?? {};
  if (message.type === "load") {
    if (!loading) {
      loading = loadModel().then(
        () => {
          post({ type: "ready", offlineClaim: false });
        },
        (error) => {
          loading = null;
          generator = null;
          post({ type: "error", phase: "load", message: String(error?.message ?? error).slice(0, 300) });
        }
      );
    }
    return;
  }
  if (message.type === "stop") {
    stopRequested = true;
    return;
  }
  if (message.type === "reset") {
    history.length = 0;
    return;
  }
  if (message.type === "resources") {
    const names = performance.getEntriesByType("resource").map((entry) => String(entry.name).split("?")[0].slice(0, 180));
    post({ type: "resources", names });
    return;
  }
  if (message.type === "generate") {
    const id = message.id;
    if (!generator) {
      post({ type: "result", id, ok: false, code: "not-ready" });
      return;
    }
    generate(message.text).then(
      (text) => post({ type: "result", id, ok: true, source: "device", text }),
      (error) => {
        const stopped = String(error?.message ?? error).includes("stopped");
        post({
          type: "result",
          id,
          ok: false,
          code: stopped ? "stopped" : "engine-failed",
          message: String(error?.message ?? error).slice(0, 300),
        });
      }
    );
  }
};

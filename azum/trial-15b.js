/**
 * Optional browser trial for Qwen2.5-1.5B-Instruct Q4_K_M.
 * It does not replace the 0.5B ONNX model or its cache.
 */
export const TRIAL_15B = {
  runtime: "@wllama/wllama@3.8.1",
  moduleUrl: "https://cdn.jsdelivr.net/npm/@wllama/wllama@3.8.1/esm/index.js",
  wasmUrl: "https://cdn.jsdelivr.net/npm/@wllama/wllama@3.8.1/src/wasm/wllama.wasm",
  modelUrl: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
  modelBytes: 1_117_320_736,
  wasmBytes: 8_763_949,
  moduleBytes: 382_633,
  license: "Apache-2.0",
  system: "Eres Azum, la IA de esta página.",
  maxNewTokens: 48,
  separateFromCache: "azum-local-ai-qwen2.5-0.5b-uint8",
};

export function trialLoadOptions() {
  return {
    n_ctx: 1024,
    n_batch: 256,
    n_ubatch: 256,
    n_gpu_layers: 0,
    n_threads: 2,
    n_parallel: 1,
    warmup: false,
    reasoning: false,
    useCache: true,
  };
}

export async function prepareTrialIsolation(view = globalThis) {
  const serviceWorker = view.navigator?.serviceWorker;
  if (serviceWorker) {
    try {
      await serviceWorker.register(new URL("./coi-serviceworker.js", import.meta.url), { updateViaCache: "none" });
      if (!serviceWorker.controller) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 4000);
          serviceWorker.addEventListener("controllerchange", () => {
            clearTimeout(timer);
            resolve();
          }, { once: true });
        });
      }
    } catch {
      if (!view.crossOriginIsolated) return "unavailable";
    }
  }
  if (view.crossOriginIsolated) return "ready";
  if (!serviceWorker) return "unavailable";
  if (!view.sessionStorage.getItem("azum-coi-reload")) {
    view.sessionStorage.setItem("azum-coi-reload", "1");
    view.location.reload();
  }
  return "reload-needed";
}

export function trialSampling() {
  return {
    temperature: 0,
    top_k: 1,
    top_p: 1,
    min_p: 0,
    penalty_repeat: 1,
    max_tokens: TRIAL_15B.maxNewTokens,
  };
}

export function formatBytes(bytes) {
  return String(bytes).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function consentText() {
  return [
    `El modelo son ${formatBytes(TRIAL_15B.modelBytes)} bytes, Qwen2.5-1.5B-Instruct Q4_K_M, licencia ${TRIAL_15B.license}.`,
    `El motor aparte son ${formatBytes(TRIAL_15B.wasmBytes)} bytes de WebAssembly y ${formatBytes(TRIAL_15B.moduleBytes)} bytes de JavaScript.`,
    "No sustituye el modelo de 0,5B ni borra su caché.",
    "En un Chrome de escritorio, al abrir esta página, el proceso llegó a unos 2,9 GiB. No está medido en la tablet: con 8 GB físicos, Android y Chrome también ocupan memoria y la carga puede fallar.",
    "La generación va en CPU, con cero capas de GPU. Una copia terminada se reutiliza en este navegador; si la copia queda a medias, la siguiente carga vuelve a pedir el archivo.",
  ].join(" ");
}

export async function loadTrialModel(Wllama, hooks = {}) {
  const wllama = new Wllama({ default: TRIAL_15B.wasmUrl });
  await wllama.loadModelFromUrl(TRIAL_15B.modelUrl, {
    ...trialLoadOptions(),
    progressCallback: hooks.onProgress,
    signal: hooks.signal,
  });
  return wllama;
}

export async function askTrial(wllama, messages, userText) {
  const text = String(userText ?? "").trim();
  if (!text) throw new Error("empty");
  messages.push({ role: "user", content: text.slice(0, 400) });
  const response = await wllama.createChatCompletion({ messages, ...trialSampling() });
  const answer = String(response?.choices?.[0]?.message?.content ?? "").trim();
  if (!answer) throw new Error("empty-generation");
  messages.push({ role: "assistant", content: answer });
  return answer;
}

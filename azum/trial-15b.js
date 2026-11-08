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
    n_threads: 1,
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

export const MOTOR_TIMEOUT_MS = 120_000;

export function stageText(stage, detail = {}) {
  const bytes = formatBytes(detail.bytes ?? 0);
  if (stage === "comprobando") return "Comprobando si el archivo ya está guardado. No se borra nada.";
  if (stage === "descargando") {
    const total = detail.total || TRIAL_15B.modelBytes;
    const pct = total ? Math.min(100, Math.round(((detail.loaded || 0) / total) * 100)) : 0;
    return `Descargando el modelo: ${formatBytes(detail.loaded || 0)} de ${formatBytes(total)} bytes (${pct} %).`;
  }
  if (stage === "guardado") return `Archivo guardado: ${formatBytes(detail.bytes || TRIAL_15B.modelBytes)} bytes. No se vuelve a descargar.`;
  if (stage === "incompleto") return `La copia guardada no está completa (${bytes}). No la borro y no vuelvo a descargar.`;
  if (stage === "ausente") return "No hay una copia guardada de este modelo. No empiezo otra descarga.";
  if (stage === "motor") return "Iniciando el motor en un hilo. Esto no es la descarga.";
  if (stage === "listo") return `Modelo listo en ${detail.ms} ms. Un hilo de CPU. Capas de GPU: 0. Aislado: ${detail.isolated}.`;
  if (stage === "motor-timeout") return "El motor no respondió en 2 minutos. El archivo sigue guardado. Pulsa Cargar otra vez: no se vuelve a pedir el peso si la copia está completa.";
  if (stage === "worker") return `Fallo del motor: ${detail.message}`;
  return stage;
}

export function withTimeout(promise, ms, code) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(code), { code })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function modelFileName() {
  return TRIAL_15B.modelUrl.split("/").pop();
}

export function classifySavedModel(files) {
  const name = modelFileName();
  const related = (files || []).filter((file) => file?.metadata?.originalURL === TRIAL_15B.modelUrl || String(file?.name || "").endsWith(`_${name}`));
  if (!related.length) return { state: "absent", bytes: 0 };
  const bytes = Math.max(...related.map((file) => Number(file.size) || 0));
  const complete = related.some((file) => file.size === TRIAL_15B.modelBytes && (file.metadata?.originalSize === TRIAL_15B.modelBytes || file.metadata?.originalURL === TRIAL_15B.modelUrl));
  return complete ? { state: "complete", bytes: TRIAL_15B.modelBytes } : { state: "incomplete", bytes };
}

export async function loadTrialModel(Wllama, hooks = {}) {
  const notes = [];
  const wllama = new Wllama({ default: TRIAL_15B.wasmUrl }, {
    logger: {
      debug() {},
      log() {},
      warn: (...parts) => notes.push(parts.join(" ")),
      error: (...parts) => {
        const message = parts.join(" ");
        notes.push(message);
        hooks.onStage?.("worker", { message });
      },
    },
  });
  const fail = async (error) => {
    await wllama.exit().catch(() => {});
    error.notes = notes;
    throw error;
  };
  try {
    hooks.onStage?.("comprobando");
    const saved = classifySavedModel(await wllama.cacheManager.list());
    if (saved.state === "incomplete") {
      hooks.onStage?.("incompleto", saved);
      await wllama.exit().catch(() => {});
      throw Object.assign(new Error("incomplete-cache"), { code: "incomplete-cache" });
    }
    if (saved.state === "absent" && !hooks.allowDownload) {
      hooks.onStage?.("ausente");
      await wllama.exit().catch(() => {});
      throw Object.assign(new Error("missing-cache"), { code: "missing-cache" });
    }
    const findModel = async () => (await wllama.modelManager.getModels()).find((item) => item.url === TRIAL_15B.modelUrl);
    let model = null;
    if (saved.state === "complete") {
      hooks.onStage?.("guardado", saved);
      const name = modelFileName();
      const files = await wllama.cacheManager.list();
      const file = files.find((item) => item.metadata?.originalURL === TRIAL_15B.modelUrl)
        || files.find((item) => item.size === TRIAL_15B.modelBytes && String(item.name || "").endsWith(`_${name}`));
      if (file && file.metadata?.originalURL !== TRIAL_15B.modelUrl) {
        await wllama.cacheManager.writeMetadata(file.name, {
          etag: file.metadata?.etag || "",
          originalSize: TRIAL_15B.modelBytes,
          originalURL: TRIAL_15B.modelUrl,
        });
      }
      model = await findModel();
    } else {
      hooks.onStage?.("descargando", { loaded: 0, total: TRIAL_15B.modelBytes });
      await wllama.modelManager.downloadModel(TRIAL_15B.modelUrl, {
        signal: hooks.signal,
        progressCallback: (progress) => hooks.onStage?.("descargando", progress),
      });
      const again = classifySavedModel(await wllama.cacheManager.list());
      if (again.state !== "complete") {
        hooks.onStage?.("incompleto", again);
        await wllama.exit().catch(() => {});
        throw Object.assign(new Error("incomplete-cache"), { code: "incomplete-cache" });
      }
      hooks.onStage?.("guardado", again);
      model = await findModel();
    }
    if (!model) {
      hooks.onStage?.("incompleto", saved);
      await wllama.exit().catch(() => {});
      throw Object.assign(new Error("incomplete-cache"), { code: "incomplete-cache" });
    }
    hooks.onStage?.("motor");
    const stop = new Promise((_, reject) => {
      if (!hooks.signal) return;
      if (hooks.signal.aborted) reject(Object.assign(new Error("abort"), { name: "AbortError" }));
      hooks.signal.addEventListener("abort", () => reject(Object.assign(new Error("abort"), { name: "AbortError" })), { once: true });
    });
    await Promise.race([
      withTimeout(wllama.loadModel(model, trialLoadOptions()), MOTOR_TIMEOUT_MS, "motor-timeout"),
      stop,
    ]);
    return wllama;
  } catch (error) {
    if (error?.code === "incomplete-cache" || error?.code === "missing-cache") throw error;
    return fail(error);
  }
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

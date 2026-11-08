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
    useCache: false,
  };
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
  return `Esta prueba voluntaria transfiere ${formatBytes(TRIAL_15B.modelBytes)} bytes de Qwen2.5-1.5B-Instruct Q4_K_M, licencia ${TRIAL_15B.license}. No sustituye el modelo de 0,5B ni borra su caché. Va en CPU, con cero capas de GPU. No está probada en la tablet y una recarga sin red falló.`;
}

export async function loadTrialModel(Wllama, modelUrl) {
  const wllama = new Wllama({ default: TRIAL_15B.wasmUrl });
  await wllama.loadModelFromUrl(modelUrl || TRIAL_15B.modelUrl, trialLoadOptions());
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

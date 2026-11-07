/**
 * On-device model plan for Azum.
 * The shipped page does not download weights and does not invent an answer.
 * A future runtime may call downloadModel only after consent. This copy keeps
 * runtimeConnected false so a tablet cannot spend data by accident.
 */

export const CACHE_NAME = "azum-local-ai-qwen2.5-0.5b-uint8";
export const ONNX_REPO = "onnx-community/Qwen2.5-0.5B-Instruct";
export const ONNX_REVISION = "22942cb7d7ba4cc81bb4673549ca4d4614469b5e";
export const GGUF_REPO = "Qwen/Qwen2.5-0.5B-Instruct-GGUF";
export const GGUF_REVISION = "9217f5db79a29953eb74d5343926648285ec7e67";
export const BASE_REPO = "Qwen/Qwen2.5-0.5B-Instruct";
export const BASE_REVISION = "7ae557604adf67be50417f59c2c2f167def9a775";
export const GGUF_FILE = "qwen2.5-0.5b-instruct-q4_k_m.gguf";
export const GGUF_BYTES = 491_400_032;
export const PARAMETERS = "0.49B";
export const LICENSE = "Apache-2.0";

export const WASM_FILES = [
  ["added_tokens.json", 605],
  ["config.json", 678],
  ["generation_config.json", 242],
  ["merges.txt", 1_671_853],
  ["onnx/model_uint8.onnx", 512_096_636],
  ["quantize_config.json", 285],
  ["special_tokens_map.json", 613],
  ["tokenizer.json", 7_031_673],
  ["tokenizer_config.json", 7_849],
  ["vocab.json", 2_776_833],
];

export const WASM_MODEL_BYTES = 512_096_636;
export const WASM_BUNDLE_BYTES = WASM_FILES.reduce((sum, file) => sum + file[1], 0);

const RULES_LABEL = "La lectura «Leer en local» es un motor de reglas. No es IA.";

const STATUS = {
  "runtime-not-connected": "No hay respuesta de IA. El motor del navegador no está conectado en esta copia.",
  "consent-required": "Sin consentimiento no se descarga ni se genera nada.",
  "unsupported-no-wasm": "Este navegador no ofrece WebAssembly. No hay modelo que ejecutar aquí.",
  cancelled: "Descarga cancelada. Se borra solo la caché de este modelo.",
  "download-failed": "La descarga no se completó. No hay respuesta de IA.",
  "empty-generation": "El motor no devolvió texto. No se inventa una respuesta.",
  "engine-failed": "El motor falló. No se inventa una respuesta.",
  "url-not-allowed": "Esa dirección no es un archivo de este modelo.",
};

export function formatBytes(bytes) {
  return new Intl.NumberFormat("es-ES").format(bytes);
}

export function fileUrl(path) {
  return `https://huggingface.co/${ONNX_REPO}/resolve/${ONNX_REVISION}/${path}`;
}

export function ggufUrl() {
  return `https://huggingface.co/${GGUF_REPO}/resolve/${GGUF_REVISION}/${GGUF_FILE}`;
}

export const MODEL_FILES = WASM_FILES.map(([path, bytes]) => ({ path, bytes, url: fileUrl(path) }));

const ALLOWED_URLS = new Set(MODEL_FILES.map((file) => file.url));

export function requirementsText() {
  return [
    `Modelo elegido: Qwen2.5-0.5B-Instruct, ${PARAMETERS} parámetros, licencia ${LICENSE}. Qwen indica más de 29 idiomas, incluido el español. No es un modelo hecho solo para España.`,
    `Navegador, variante de CPU uint8: el archivo del modelo pesa ${formatBytes(WASM_MODEL_BYTES)} bytes y el conjunto con tokenizador y configuración pesa ${formatBytes(WASM_BUNDLE_BYTES)} bytes. Revisión ${ONNX_REVISION} de ${ONNX_REPO}, tamaños leídos en la API de Hugging Face el 7 de noviembre de 2026. Esa cifra no incluye el motor Transformers.js.`,
    `Programa nativo: ${GGUF_FILE} pesa ${formatBytes(GGUF_BYTES)} bytes en ${GGUF_REPO}, revisión ${GGUF_REVISION}, también Apache 2.0.`,
    "Qwen no publica una RAM mínima para esta tablet. Propuesta, no medida: la RAM física libre tendría que superar el archivo, y el punto de partida recomendado es 8 GB físicos. Los 6 GB virtuales de la foto no cuentan; son intercambio y esta página no puede verlos.",
    "La foto describe Lenovo TB336FU, Dimensity 6300, 8 GB físicos, 6 GB virtuales, 256 GB con 162 GB libres y Android 16. MediaTek indica GPU Arm Mali-G57 MC2. Chrome documenta WebGPU en Android 12 o superior con GPU ARM, Qualcomm o Intel. Esta tablet no se ha probado: ni WebGPU, ni la NPU, ni una velocidad.",
    "162 GB libres bastan para el archivo. No borres nada.",
    "Esta copia no descarga el modelo, no llama a una API de pago, no abre un servidor y no comparte la tablet.",
  ].join(" ");
}

export function assessDevice(input = {}) {
  const wasm = input.webAssembly === true;
  const webgpu = input.webgpu === "adapter" || input.webgpu === "no-adapter" || input.webgpu === "absent"
    ? input.webgpu
    : "unknown";
  const deviceMemoryGb = Number.isFinite(input.deviceMemoryGb) ? input.deviceMemoryGb : null;
  return {
    wasm,
    webgpu,
    deviceMemoryGb,
    deviceMemoryIsPhysical: false,
    virtualRamCounted: false,
    npuUsed: false,
    speedKnown: false,
    tabletTested: false,
    runtimeConnected: false,
    downloadOffered: false,
    guidance: wasm ? "wasm-present-runtime-not-connected" : "unsupported-no-wasm",
  };
}

export async function probeWebGpu(gpu, timeoutMs = 3000) {
  if (!gpu || typeof gpu.requestAdapter !== "function") return "absent";
  let timer;
  try {
    const adapter = await Promise.race([
      gpu.requestAdapter(),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
    return adapter ? "adapter" : "no-adapter";
  } catch {
    return "no-adapter";
  } finally {
    clearTimeout(timer);
  }
}

export function panelState(input = {}) {
  const assessment = assessDevice(input);
  return {
    rulesLabel: RULES_LABEL,
    requirements: requirementsText(),
    downloadEnabled: false,
    generateEnabled: false,
    geminiEnabled: false,
    paymentsEnabled: false,
    assessment,
    status: STATUS["runtime-not-connected"],
    manualSteps: [
      "Abre Azum y usa «Leer en local». Esa lectura es de reglas, no de IA.",
      "Lee los requisitos de esta sección. No borres archivos: el espacio libre de la foto ya cubre el modelo.",
      "No pulses una descarga en esta copia: el botón está apagado y no hay respuesta de IA.",
      "Si más adelante quieres el modelo en la tablet, descarga solo el GGUF oficial de Qwen y compila el ejemplo Android de llama.cpp en tu máquina. Este repositorio no instala nada en la tablet y no la convierte en servidor.",
    ],
  };
}

export function statusText(code) {
  return STATUS[code] ?? STATUS["runtime-not-connected"];
}

export async function downloadModel({
  fetchImpl,
  cachePut,
  consent,
  runtimeConnected,
  files = MODEL_FILES,
  signal,
  onProgress,
  removePartial,
}) {
  if (runtimeConnected !== true) return { ok: false, code: "runtime-not-connected", bytes: 0 };
  if (consent !== true) return { ok: false, code: "consent-required", bytes: 0 };
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  let loaded = 0;
  for (const file of files) {
    if (!ALLOWED_URLS.has(file.url)) return { ok: false, code: "url-not-allowed", bytes: loaded };
    if (signal?.aborted) {
      await removePartial?.();
      return { ok: false, code: "cancelled", bytes: loaded };
    }
    let response;
    try {
      response = await fetchImpl(file.url, { signal });
    } catch (error) {
      if (error?.name === "AbortError" || signal?.aborted) {
        await removePartial?.();
        return { ok: false, code: "cancelled", bytes: loaded };
      }
      await removePartial?.();
      return { ok: false, code: "download-failed", bytes: loaded };
    }
    if (!response?.ok) {
      await removePartial?.();
      return { ok: false, code: "download-failed", bytes: loaded };
    }
    await cachePut(file.url, response);
    loaded += file.bytes;
    onProgress?.({ loaded, total });
  }
  return { ok: true, code: "downloaded", bytes: loaded, total };
}

export async function removeOwnModel(caches) {
  if (!caches || typeof caches.delete !== "function") {
    return { ok: false, code: "no-cache" };
  }
  const deleted = await caches.delete(CACHE_NAME);
  return { ok: true, code: "removed", deleted: deleted === true, cacheName: CACHE_NAME };
}

export async function runLocalTurn({ engine, text, runtimeConsent }) {
  if (runtimeConsent !== true) {
    return { ok: false, code: "consent-required", text: null, source: "none" };
  }
  if (!engine || typeof engine.generate !== "function") {
    return { ok: false, code: "runtime-not-connected", text: null, source: "none" };
  }
  const prompt = String(text ?? "").trim();
  if (!prompt) return { ok: false, code: "empty-generation", text: null, source: "none" };
  try {
    const result = await engine.generate(prompt);
    const generated = typeof result?.text === "string" ? result.text.trim() : "";
    if (!generated) return { ok: false, code: "empty-generation", text: null, source: "none" };
    if (result.mock === true) {
      return { ok: true, code: "mock", text: generated, source: "mock" };
    }
    return { ok: true, code: "device-inference", text: generated, source: "device" };
  } catch {
    return { ok: false, code: "engine-failed", text: null, source: "none" };
  }
}

function addParagraph(doc, parent, text, className) {
  const p = doc.createElement("p");
  if (className) p.className = className;
  p.textContent = text;
  parent.appendChild(p);
  return p;
}

export function mount(doc, input = {}) {
  const body = doc.body;
  if (!body) return null;
  const state = panelState(input);
  const pill = doc.querySelector?.(".pill");
  if (pill && !doc.getElementById("azum-rules-label")) {
    const note = doc.createElement("p");
    note.id = "azum-rules-label";
    note.className = "azum-rules-label";
    note.textContent = state.rulesLabel;
    pill.insertAdjacentElement("afterend", note);
  }
  if (doc.getElementById("azum-local-ai")) return doc.getElementById("azum-local-ai");

  const section = doc.createElement("section");
  section.id = "azum-local-ai";
  section.className = "azum-local-ai";
  const title = doc.createElement("h2");
  title.textContent = "IA en este aparato";
  section.appendChild(title);
  addParagraph(doc, section, "Aparte de las reglas y de Gemini. Gemini y los pagos siguen apagados.", "azum-local-kicker");
  const status = addParagraph(doc, section, state.status, "azum-local-state");
  status.dataset.state = "off";
  addParagraph(doc, section, state.requirements);
  const list = doc.createElement("ol");
  for (const step of state.manualSteps) {
    const item = doc.createElement("li");
    item.textContent = step;
    list.appendChild(item);
  }
  section.appendChild(list);
  const probe = doc.createElement("button");
  probe.type = "button";
  probe.id = "azum-local-probe";
  probe.textContent = "Comprobar este navegador";
  const download = doc.createElement("button");
  download.type = "button";
  download.id = "azum-local-download";
  download.disabled = true;
  download.textContent = `Descarga apagada (${formatBytes(WASM_BUNDLE_BYTES)} bytes)`;
  const remove = doc.createElement("button");
  remove.type = "button";
  remove.id = "azum-local-remove";
  remove.textContent = "Borrar solo la caché de este modelo";
  const result = doc.createElement("p");
  result.id = "azum-local-result";
  result.setAttribute("aria-live", "polite");
  section.append(probe, download, remove, result);
  body.appendChild(section);

  probe.addEventListener("click", async () => {
    const nav = doc.defaultView?.navigator ?? {};
    const webgpu = await probeWebGpu(nav.gpu);
    const assessment = assessDevice({
      webAssembly: typeof doc.defaultView?.WebAssembly === "object",
      webgpu,
      deviceMemoryGb: Number.isFinite(nav.deviceMemory) ? nav.deviceMemory : null,
    });
    const memory = assessment.deviceMemoryGb == null
      ? "El navegador no dice cuánta RAM hay."
      : `El navegador informa un cubo de unos ${assessment.deviceMemoryGb} GB. Eso no separa los 8 GB físicos de los 6 GB virtuales.`;
    const gpu = assessment.webgpu === "adapter"
      ? "WebGPU tiene un adaptador. No se ha medido la velocidad y no se usa la NPU."
      : assessment.webgpu === "absent"
        ? "WebGPU no está en este navegador. No es un fallo de la tablet hasta probar Chrome, y tampoco promete funcionar allí."
        : "WebGPU no ofreció un adaptador usable. La velocidad sigue sin medirse.";
    result.textContent = `${assessment.wasm ? "Hay WebAssembly." : "No hay WebAssembly."} ${gpu} ${memory} ${statusText(assessment.guidance === "unsupported-no-wasm" ? "unsupported-no-wasm" : "runtime-not-connected")}`;
  });

  remove.addEventListener("click", async () => {
    const caches = doc.defaultView?.caches;
    const outcome = await removeOwnModel(caches);
    result.textContent = outcome.ok
      ? "Se pidió borrar solo la caché azum-local-ai-qwen2.5-0.5b-uint8. Ningún otro dato entra en esa orden."
      : "Este navegador no tiene caché que borrar.";
  });

  return section;
}

if (typeof document !== "undefined") {
  const start = () => mount(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  const observer = new MutationObserver(() => {
    if (!document.getElementById("azum-local-ai") || !document.getElementById("azum-rules-label")) start();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * On-device model plan for Azum.
 * The page downloads weights only after a consent checkbox.
 * Generation runs in a worker. A missing or failed model never invents an answer.
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
export const RUNTIME_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/+esm";
export const MAX_NEW_TOKENS = 48;
export const MAX_PROMPT_CHARS = 400;

const RULES_LABEL = "La lectura «Leer en local» es un motor de reglas. No es IA.";

const STATUS = {
  "runtime-not-connected": "Marca el consentimiento para descargar el modelo. Todavía no hay una respuesta.",
  "consent-required": "Sin consentimiento no se descarga ni se genera nada.",
  "unsupported-no-wasm": "Este navegador no ofrece WebAssembly. No hay modelo que ejecutar aquí.",
  "isolation-needed": "El motor necesita una recarga para activar su memoria. La descarga del modelo no ha empezado.",
  stopped: "Generación parada. No se inventa el resto.",
  "not-ready": "El modelo todavía no está cargado.",
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
    `La descarga no empieza sola. Si marcas el consentimiento, el modelo (unos ${formatBytes(WASM_BUNDLE_BYTES)} bytes) se pide a Hugging Face y el motor Transformers.js 4.3.2 a jsDelivr. Conviene usar Wi-Fi. La pregunta no sale de este aparato. La página puede volver a abrirse sin red después de visitarla, pero en la prueba de este ordenador cargar el modelo otra vez sin red falló. No hay uso sin conexión medido.`,
  ].join(" ");
}

export function labelFor(source) {
  if (source === "device") return "IA local del navegador. Texto generado ahora en este aparato.";
  if (source === "app-rule") return "Regla de la aplicación. No es texto nuevo del modelo.";
  if (source === "mock") return "Simulación de prueba. No es una respuesta del modelo.";
  if (source === "rules") return "Motor de reglas. No es IA.";
  return "No hay respuesta de IA.";
}

function foldQuestion(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function identityReply(text) {
  const folded = foldQuestion(text);
  const aboutIdentity =
    /\b(como te llamas|tu nombre|quien eres|que eres)\b/.test(folded) ||
    /\b(eres humano|eres una persona|eres persona|eres gente)\b/.test(folded) ||
    /\b(eres grok|eres gemini|eres chatgpt|eres copilot)\b/.test(folded);
  if (!aboutIdentity) return null;
  return "Soy Azum, la IA local de esta página. No soy una persona ni Grok.";
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
    runtimeConnected: wasm,
    downloadOffered: wasm,
    guidance: wasm ? "wasm-ready" : "unsupported-no-wasm",
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
  const consent = input.consent === true;
  return {
    rulesLabel: RULES_LABEL,
    requirements: requirementsText(),
    downloadEnabled: assessment.wasm && consent && input.modelReady !== true,
    generateEnabled: input.modelReady === true && input.busy !== true,
    geminiEnabled: false,
    paymentsEnabled: false,
    assessment,
    status: assessment.wasm ? STATUS["runtime-not-connected"] : STATUS["unsupported-no-wasm"],
    manualSteps: [
      "Abre esta página en Chrome. Si se recarga una vez, es para la memoria del motor, no para bajar el modelo.",
      "Lee el tamaño, marca el consentimiento y pulsa descargar. Mejor por Wi-Fi. No borres otros archivos.",
      "Cuando diga que el modelo está cargado, escribe una pregunta. La respuesta marcada como IA local sale de este navegador.",
      "«Leer en local» sigue siendo el motor de reglas y no es IA. Gemini y los pagos siguen apagados. Esta tablet concreta no está medida.",
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

function button(doc, id, text) {
  const element = doc.createElement("button");
  element.type = "button";
  element.id = id;
  element.textContent = text;
  return element;
}

export function mount(doc, input = {}) {
  const body = doc.body;
  const view = doc.defaultView ?? globalThis;
  if (!body) return null;
  const initial = panelState({
    webAssembly: typeof view.WebAssembly === "object",
    webgpu: "unknown",
    deviceMemoryGb: Number.isFinite(view.navigator?.deviceMemory) ? view.navigator.deviceMemory : null,
    consent: false,
  });
  const pill = doc.querySelector?.(".pill");
  if (pill && !doc.getElementById("azum-rules-label")) {
    const note = doc.createElement("p");
    note.id = "azum-rules-label";
    note.className = "azum-rules-label";
    note.textContent = initial.rulesLabel;
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
  const status = addParagraph(doc, section, initial.status, "azum-local-state");
  status.dataset.state = initial.assessment.wasm ? "idle" : "unsupported";
  const feedback = addParagraph(doc, section, "Aquí aparecerá lo que hagan los botones.", "azum-local-feedback");
  feedback.id = "azum-local-feedback";
  feedback.dataset.state = status.dataset.state;
  addParagraph(doc, section, initial.requirements);
  const list = doc.createElement("ol");
  for (const step of initial.manualSteps) {
    const item = doc.createElement("li");
    item.textContent = step;
    list.appendChild(item);
  }
  section.appendChild(list);

  const consentLabel = doc.createElement("label");
  consentLabel.className = "azum-local-consent";
  const consent = doc.createElement("input");
  consent.type = "checkbox";
  consent.id = "azum-local-consent";
  const consentText = doc.createElement("span");
  consentText.textContent = `Acepto descargar el modelo (${formatBytes(WASM_BUNDLE_BYTES)} bytes) desde Hugging Face. El motor viaja con la página y, la primera vez, su WebAssembly sale de jsDelivr. Conviene usar Wi-Fi. La pregunta no se envía a un servidor.`;
  consentLabel.append(consent, consentText);

  const probe = button(doc, "azum-local-probe", "Comprobar este navegador");
  const download = button(doc, "azum-local-download", `Descargar y cargar (${formatBytes(WASM_BUNDLE_BYTES)} bytes)`);
  const cancel = button(doc, "azum-local-cancel", "Cancelar la descarga");
  cancel.disabled = true;
  const remove = button(doc, "azum-local-remove", "Borrar solo la caché de este modelo");
  const retry = button(doc, "azum-local-retry", "Reintentar la carga");
  retry.disabled = true;

  const questionLabel = doc.createElement("label");
  questionLabel.className = "azum-local-field";
  questionLabel.textContent = "Pregunta para la IA local";
  const question = doc.createElement("textarea");
  question.id = "azum-local-question";
  question.maxLength = MAX_PROMPT_CHARS;
  question.rows = 3;
  question.placeholder = "Escribe una pregunta en español";
  questionLabel.appendChild(question);

  const ask = button(doc, "azum-local-ask", "Preguntar a la IA local");
  ask.disabled = true;
  const stop = button(doc, "azum-local-stop", "Parar");
  stop.disabled = true;
  const progress = addParagraph(doc, section, "", "azum-local-progress");
  const answer = doc.createElement("p");
  answer.id = "azum-local-answer";
  answer.dataset.source = "none";
  answer.setAttribute("aria-live", "polite");
  const badge = doc.createElement("p");
  badge.id = "azum-local-badge";
  badge.className = "azum-local-badge";
  badge.textContent = labelFor("none");
  const log = doc.createElement("div");
  log.id = "azum-local-log";

  section.append(consentLabel, probe, download, cancel, retry, remove, feedback, questionLabel, ask, stop, progress, badge, answer, log);
  body.appendChild(section);

  let modelReady = false;
  let engine = null;

  function setStatus(text, stateName) {
    status.textContent = text;
    status.dataset.state = stateName;
    feedback.textContent = text;
    feedback.dataset.state = stateName;
    feedback.scrollIntoView({ block: "nearest" });
  }

  function showAnswer(source, text) {
    badge.textContent = labelFor(source);
    answer.dataset.source = source;
    answer.textContent = text ?? "";
  }

  function syncButtons() {
    ask.disabled = !question.value.trim();
  }

  consent.addEventListener("change", syncButtons);
  question.addEventListener("input", syncButtons);

  function remember(source, text) {
    const turn = doc.createElement("article");
    turn.dataset.source = source;
    const asked = doc.createElement("p");
    asked.textContent = "Pregunta: " + question.value.trim();
    const mark = doc.createElement("p");
    mark.className = "azum-local-badge";
    mark.textContent = labelFor(source);
    const said = doc.createElement("p");
    said.textContent = text;
    turn.append(asked, mark, said);
    log.appendChild(turn);
  }

  async function engineApi() {
    if (!engine) engine = await import("./local-ai-engine.js");
    return engine;
  }

  async function prepareIsolation() {
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

  probe.addEventListener("click", async () => {
    setStatus("Comprobando este navegador…", "busy");
    let webgpu = "unknown";
    try {
      webgpu = await probeWebGpu(view.navigator?.gpu);
    } catch (error) {
      setStatus(`No pude comprobar WebGPU. ${String(error?.message ?? error).slice(0, 180)}`, "error");
      return;
    }
    const assessment = assessDevice({
      webAssembly: typeof view.WebAssembly === "object",
      webgpu,
      deviceMemoryGb: Number.isFinite(view.navigator?.deviceMemory) ? view.navigator.deviceMemory : null,
    });
    const memory = assessment.deviceMemoryGb == null
      ? "El navegador no dice cuánta RAM hay."
      : `El navegador informa un cubo de unos ${assessment.deviceMemoryGb} GB. Eso no separa los 8 GB físicos de los 6 GB virtuales.`;
    const gpu = assessment.webgpu === "adapter"
      ? "WebGPU tiene un adaptador. La generación usa la CPU por WebAssembly. No se ha medido la velocidad y no se usa la NPU."
      : "WebGPU no se usa para generar. La vía es la CPU por WebAssembly. La velocidad no está medida.";
    const isolation = view.crossOriginIsolated ? "La memoria del motor está activa." : "La memoria del motor aún no está aislada.";
    setStatus(`${assessment.wasm ? "Hay WebAssembly." : "No hay WebAssembly."} ${gpu} ${memory} ${isolation}`, assessment.wasm ? "idle" : "unsupported");
  });

  download.addEventListener("click", async () => {
    setStatus("He recibido «Descargar y cargar».", "busy");
    if (!consent.checked) {
      setStatus("Marca primero el consentimiento. Sin eso no descargo nada.", "error");
      return;
    }
    if (typeof view.WebAssembly !== "object") {
      setStatus(statusText("unsupported-no-wasm"), "unsupported");
      return;
    }
    const isolation = await prepareIsolation();
    if (isolation !== "ready") {
      setStatus(statusText("isolation-needed"), "error");
      return;
    }
    download.disabled = true;
    cancel.disabled = false;
    retry.disabled = true;
    showAnswer("none", "");
    setStatus("Descargando y cargando el modelo en este navegador.", "downloading");
    try {
      const api = await engineApi();
      await api.load((item) => {
        const percent = item.progress == null ? "" : ` ${Math.round(item.progress)} %`;
        const line = `Descarga: ${item.status}${item.file ? " " + item.file : ""}${percent}`;
        progress.textContent = line;
        feedback.textContent = line;
      });
      modelReady = true;
      cancel.disabled = true;
      retry.disabled = true;
      syncButtons();
      progress.textContent = "";
      setStatus("Modelo cargado en este navegador. Puedes preguntar.", "ready");
    } catch (error) {
      modelReady = false;
      download.disabled = false;
      cancel.disabled = true;
      retry.disabled = false;
      syncButtons();
      showAnswer("none", statusText("engine-failed"));
      setStatus(`No se pudo cargar el modelo. ${String(error?.message ?? error).slice(0, 300)}`, "error");
    }
  });

  cancel.addEventListener("click", async () => {
    engine?.unload?.();
    engine = null;
    modelReady = false;
    cancel.disabled = true;
    await removeOwnModel(view.caches);
    syncButtons();
    showAnswer("none", statusText("cancelled"));
    setStatus(statusText("cancelled"), "idle");
  });

  retry.addEventListener("click", () => {
    if (!consent.checked) {
      setStatus("Marca el consentimiento para reintentar.", "error");
      return;
    }
    engine?.unload?.();
    engine = null;
    modelReady = false;
    download.disabled = false;
    download.click();
  });

  ask.addEventListener("click", async () => {
    const text = question.value.trim();
    if (!text) {
      setStatus("Escribe una pregunta.", "error");
      return;
    }
    const ruled = identityReply(text);
    if (ruled) {
      showAnswer("app-rule", ruled);
      remember("app-rule", ruled);
      ask.disabled = false;
      setStatus("Esta frase es una regla de la aplicación. El modelo no la ha escrito.", "ready");
      return;
    }
    if (!modelReady || !engine) {
      setStatus("El modelo todavía no está cargado.", "error");
      return;
    }
    stop.disabled = false;
    ask.disabled = true;
    showAnswer("device", "");
    setStatus("Generando en este navegador. El cálculo pesado va en el worker del motor.", "generating");
    try {
      const generated = await engine.ask(text, (chunk) => {
        answer.dataset.source = "device";
        badge.textContent = labelFor("device");
        answer.textContent += chunk;
      });
      showAnswer("device", generated);
      remember("device", generated);
      stop.disabled = true;
      ask.disabled = false;
      setStatus("Respuesta generada en este navegador.", "ready");
    } catch (error) {
      stop.disabled = true;
      ask.disabled = false;
      const stopped = String(error?.message ?? error).includes("stopped");
      showAnswer("none", statusText(stopped ? "stopped" : "engine-failed"));
      setStatus(statusText(stopped ? "stopped" : "engine-failed"), stopped ? "ready" : "error");
      if (!stopped) retry.disabled = false;
    }
  });

  stop.addEventListener("click", () => {
    engine?.requestStop?.();
    stop.disabled = true;
    setStatus("Parando la generación.", "generating");
  });

  remove.addEventListener("click", async () => {
    engine?.resetHistory?.();
    engine?.unload?.();
    engine = null;
    modelReady = false;
    const outcome = await removeOwnModel(view.caches);
    syncButtons();
    showAnswer("none", outcome.ok
      ? "Se pidió borrar solo la caché de este modelo. Las reglas y el resto del navegador no entran en esa orden."
      : "Este navegador no tiene caché que borrar.");
    setStatus("Modelo descargado retirado de la caché de este nombre.", "idle");
  });

  prepareIsolation().catch(() => {});
  return section;
}

if (typeof document !== "undefined") {
  // Mount after load so React can hydrate the static page first (avoids #418).
  // mount() itself stays synchronous for tests that call it directly.
  const start = () => mount(document);
  const afterHydration = () => {
    const go = () => {
      start();
      if (document.body) {
        const observer = new MutationObserver(() => {
          if (!document.getElementById("azum-local-ai") || !document.getElementById("azum-rules-label")) start();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setTimeout(go, 0));
    } else setTimeout(go, 0);
  };
  if (document.readyState === "complete") afterHydration();
  else (document.defaultView || window).addEventListener("load", afterHydration, { once: true });
}

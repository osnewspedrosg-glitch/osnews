import "./lorena.js"; // Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews): define globalThis.OSN_LORENA
import { GUIDED_LABEL, dispatch, forgetGuidedMemory, loadMemory, STORAGE_KEY, loadDecisions, clearDecisions } from "./guided-chat.js";
import { answer as booksAnswer, loadIndex as loadBooks, isBookQuestion, EXAMPLES as BOOK_EXAMPLES } from "./libros-qa.js";

const KEY = STORAGE_KEY;

function isComposingEvent(event) {
  return Boolean(event && (event.isComposing || event.keyCode === 229));
}

function committedValue(el) {
  if (!el) return "";
  if (typeof el.blur === "function") el.blur();
  return String(el.value || "").trim();
}


function add(doc, parent, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  parent.appendChild(node);
  return node;
}

export function mount(doc) {
  const body = doc.body;
  if (!body || doc.getElementById("azum-guided")) return doc.getElementById("azum-guided");
  const storage = doc.defaultView?.localStorage;
  if (!storage) return null;
  const section = doc.createElement("section");
  section.id = "azum-guided";
  section.className = "azum-guided";
  add(doc, section, "p", "azum-guided-label", GUIDED_LABEL);
  add(doc, section, "h2", null, "Charla de Azum");
  add(doc, section, "p", "azum-guided-note", "Funciona al abrir la página. No descarga ningún modelo y no llama a Copilot, Grok ni a un servidor. Los demás apartados siguen en su sitio.");
  const form = doc.createElement("form");
  form.id = "azum-guided-form";
  form.autocomplete = "off";
  const field = doc.createElement("label");
  field.className = "azum-guided-field";
  field.append("Mensaje");
  const input = doc.createElement("textarea");
  input.id = "azum-guided-input";
  input.rows = 3;
  input.maxLength = 400;
  input.placeholder = "Por ejemplo: hola";
  field.appendChild(input);
  const send = doc.createElement("button");
  send.type = "submit";
  send.id = "azum-guided-send";
  send.className = "azum-guided-send";
  send.textContent = "Enviar a la charla guiada";
  const forget = doc.createElement("button");
  forget.type = "button";
  forget.id = "azum-guided-forget";
  forget.className = "azum-guided-forget";
  forget.textContent = "Olvidar esta charla";
  const status = add(doc, form, "p", "azum-guided-status", "Escribe cuando quieras. Lo que cuentes se queda en este aparato.");
  status.id = "azum-guided-status";
  form.append(field, send, forget, status);
  const log = add(doc, section, "div", "azum-guided-log", "");
  log.id = "azum-guided-log";
  const tools = add(doc, section, "p", "azum-guided-tools", "");
  const guideLink = doc.createElement("a");
  guideLink.id = "azum-guia-mujeres";
  guideLink.className = "azum-guia-link";
  guideLink.href = "../lorena/#guia-mujeres";
  guideLink.textContent = "Guía para mujeres";
  guideLink.title = "Analiza en este aparato mensajes que hayas recibido. Nada sale del dispositivo.";
  tools.appendChild(guideLink);
  const decisions = doc.createElement("details");
  decisions.className = "azum-decision";
  decisions.id = "azum-decision";
  const sum = add(doc, decisions, "summary", null, "Registro de decisión de Azum");
  add(doc, decisions, "p", "azum-decision-note", "Qué papel y qué modo eligió Azum en este aparato, con el análisis de Lorena. Se queda aquí.");
  const dlog = add(doc, decisions, "ol", "azum-decision-log", "");
  dlog.id = "azum-decision-log";
  const dclear = doc.createElement("button");
  dclear.type = "button";
  dclear.id = "azum-decision-clear";
  dclear.className = "azum-guided-forget";
  dclear.textContent = "Borrar registro de decisión";
  decisions.appendChild(dclear);
  // «Pregunta sobre los libros»: índice local de los libros de Pedro, sin servidor ni IA generativa.
  const books = doc.createElement("div");
  books.id = "azum-libros";
  books.className = "azum-libros";
  add(doc, books, "h3", null, "Pregunta sobre los libros");
  add(doc, books, "p", "azum-libros-note", "Azum responde solo con el texto real de los libros de Pedro, citado tal cual, con el libro y el capítulo. Si no está en los libros, te lo dice. Busca en este aparato: tu pregunta no sale de aquí.");
  const bform = doc.createElement("form");
  bform.id = "azum-libros-form";
  bform.autocomplete = "off";
  const blabel = doc.createElement("label");
  blabel.className = "azum-guided-field";
  blabel.append("Tu pregunta sobre los libros");
  const binput = doc.createElement("input");
  binput.type = "search";
  binput.id = "azum-libros-input";
  binput.maxLength = 200;
  binput.placeholder = "Por ejemplo: ¿Quién es Aya?";
  blabel.appendChild(binput);
  const bsend = doc.createElement("button");
  bsend.type = "submit";
  bsend.id = "azum-libros-send";
  bsend.className = "azum-guided-send";
  bsend.textContent = "Preguntar a los libros";
  bform.append(blabel, bsend);
  const chips = add(doc, books, "div", "azum-libros-chips", "");
  chips.id = "azum-libros-ejemplos";
  BOOK_EXAMPLES.forEach((q) => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "azum-libros-chip";
    b.textContent = q;
    b.addEventListener("click", () => { binput.value = q; askBooks(q); });
    chips.appendChild(b);
  });
  books.insertBefore(bform, chips);
  add(doc, books, "p", "azum-libros-credit", "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.");

  section.append(form, books, log, tools, decisions);
  const stack = doc.querySelector("#contenido .stack") || doc.querySelector("#contenido") || body;
  stack.insertBefore(section, stack.firstChild);

  // MODULO_LORENA_V1 — diseño de Pedro Sánchez Gómez (OSNews): memoria del usuario + memoria de Azum
  // → análisis de emociones (estimación programada por palabras, no una medición clínica)
  // → respuesta con inteligencia emocional → retroalimentación a las dos memorias. Solo en este aparato.
  const lorena = doc.defaultView?.OSN_LORENA
    ? doc.defaultView.OSN_LORENA.create({ app: "azum", assistant: "Azum", storage, userName: () => loadMemory(storage).name })
    : null;
  if (lorena) {
    lorena.mount(section, {
      buttonClass: "azum-guided-forget",
      buttonText: "Borrar memoria Lorena",
      noteText: "🔒 Solo en este aparato. Estimación programada por palabras, no es una medición clínica ni una emoción de Azum.",
      onForget: () => { status.textContent = "He borrado la memoria emocional del Módulo Lorena en este aparato."; },
    });
  }

  function paint(text) {
    const turn = doc.createElement("p");
    turn.textContent = text;
    log.appendChild(turn);
    turn.scrollIntoView({ block: "nearest" });
  }

  function paintDecisions() {
    dlog.textContent = "";
    const rows = loadDecisions(storage).slice().reverse();
    if (!rows.length) {
      add(doc, dlog, "li", "azum-decision-empty", "Todavía no hay decisiones guardadas en este aparato.");
      return;
    }
    rows.forEach((row) => {
      const li = add(doc, dlog, "li", null, "");
      const mode = row.modeLabel || (row.mode === "eva" ? "modo Eva" : row.mode === "lorena" ? "modo Lorena" : "—");
      const emo = row.emotion ? `${row.emotion}${row.intensity != null ? " " + row.intensity + "/10" : ""}` : "—";
      const mac = row.machista ? " · actitud machista detectada" : "";
      const cands = Array.isArray(row.candidates)
        ? row.candidates.map((c) => `${c.role || c.roleId}:${c.score}`).join(", ")
        : "";
      li.textContent = `${mode} · papel ${row.picked || "—"} · ${emo}${mac}` + (cands ? ` · candidatos: ${cands}` : "");
    });
  }
  paintDecisions();

  let bookIndex = null;
  let usageSent = false;
  function countBookUse() {
    // Contador anónimo GoatCounter (cuenta osnews-may, el mismo de Azum): solo cuenta que se usó
    // la sección, nunca el texto de la pregunta. Solo en la página publicada.
    if (usageSent) return;
    const win = doc.defaultView;
    if (!win || win.location?.hostname !== "osnewspedrosg-glitch.github.io") return;
    const gc = win.goatcounter;
    if (!gc || typeof gc.count !== "function") return;
    usageSent = true;
    try { gc.count({ path: "/osnews/azum/libros-pregunta", title: "Azum · Pregunta sobre los libros", event: true }); } catch {}
  }

  function paintBooks(question, result) {
    const turn = doc.createElement("div");
    turn.className = "azum-libros-turn" + (result.found ? "" : " azum-libros-none");
    turn.dataset.kind = result.kind;
    add(doc, turn, "p", "azum-libros-q", `Tú: ${question}`);
    add(doc, turn, "p", "azum-libros-a", `Azum · Libros: ${result.text}`);
    if (result.links && result.links.length) {
      const ul = add(doc, turn, "ul", "azum-libros-links", "");
      result.links.forEach((l) => {
        const li = add(doc, ul, "li", null, "");
        const a = doc.createElement("a");
        a.href = l.url;
        a.textContent = l.label;
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        if (l.grok) a.className = "azum-libros-grok";
        li.appendChild(a);
      });
    }
    log.appendChild(turn);
    turn.scrollIntoView({ block: "nearest" });
  }

  async function askBooks(text) {
    const question = String(text || "").trim();
    if (!question) {
      status.dataset.kind = "error";
      status.textContent = "Escribe una pregunta sobre los libros.";
      return null;
    }
    status.dataset.kind = "ready";
    status.textContent = "Buscando en los libros, en este aparato…";
    try {
      bookIndex = bookIndex || await loadBooks(doc.defaultView.fetch.bind(doc.defaultView), new URL("./libros-index.json", import.meta.url));
      const result = booksAnswer(bookIndex, question);
      paintBooks(question, result);
      status.textContent = result.found ? "Respuesta sacada de los libros, citada tal cual." : "No está en los libros. No invento respuestas.";
      binput.value = "";
      countBookUse();
      return result;
    } catch (error) {
      status.dataset.kind = "error";
      status.textContent = `No se pudo abrir el índice de los libros: ${error?.message || error}`;
      return null;
    }
  }
  section.askBooks = askBooks;

  bform.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isComposingEvent(event)) return;
    askBooks(committedValue(binput));
  });

  function roleId() {
    return doc.querySelector(".app select")?.value || "core";
  }

  let lastFire = 0;
  let lastText = "";
  function submitText() {
    const text = committedValue(input);
    const now = Date.now();
    if (!text) {
      if (now - lastFire < 500) return;
      status.dataset.kind = "error";
      status.textContent = "Escribe un mensaje.";
      return;
    }
    if (text === lastText && now - lastFire < 500) return;
    lastFire = now;
    lastText = text;
    // Si la pregunta es sobre los libros, responde la sección de libros (una sola respuesta).
    if (isBookQuestion(bookIndex, text) && /[?¿]|\b(de que|quien|que dice|que pasa|who|what)\b/i.test(text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
      input.value = "";
      askBooks(text);
      return;
    }
    try {
      // One send → Lorena analyzes → Azum picks one reply → Lorena adapts its tone.
      const result = dispatch(text, loadMemory(storage), roleId(), storage, lorena);
      status.dataset.kind = result.stored ? "ready" : "error";
      status.textContent = result.stored
        ? "Respuesta lista. Se queda en este aparato."
        : `No se pudo guardar en este aparato: ${result.error}`;
      paint(`Tú: ${text}\nAzum: ${result.text}`);
      paintDecisions();
      input.value = "";
    } catch (error) {
      status.dataset.kind = "error";
      status.textContent = `No se pudo responder: ${error?.message || error}`;
    }
  }

  send.addEventListener("pointerdown", () => {
    if (typeof input.blur === "function") input.blur();
  }, true);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isComposingEvent(event)) return;
    submitText();
  });
  send.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") return;
    event.preventDefault();
    submitText();
  });
  input.addEventListener("keydown", (event) => {
    if (isComposingEvent(event)) {
      if (event.key === "Enter" || event.keyCode === 13) event.preventDefault();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitText();
    }
  });

  dclear.addEventListener("click", () => {
    clearDecisions(storage);
    paintDecisions();
    status.textContent = "He borrado el registro de decisión en este aparato.";
  });

  forget.addEventListener("click", () => {
    const before = Object.keys(storage);
    forgetGuidedMemory(storage);
    if (lorena) lorena.forget();
    log.textContent = "";
    status.textContent = storage.getItem(KEY) === null
      ? "He olvidado solo esta charla. El resto de datos de este aparato sigue donde estaba."
      : "No pude borrar esta charla.";
    section.dataset.otherKeys = String(before.filter((item) => item !== KEY).length);
  });

  return section;
}

if (typeof document !== "undefined") {
  // Mount after load so React can hydrate the static page first (avoids #418).
  // mount() itself stays synchronous for tests that call it directly.
  let armed = false;
  const start = () => { if (armed) mount(document); };
  const arm = () => {
    if (armed) return;
    armed = true;
    start();
    if (document.body) {
      const observer = new MutationObserver(() => {
        if (!document.getElementById("azum-guided")) start();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };
  const afterHydration = () => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setTimeout(arm, 0));
    } else setTimeout(arm, 0);
  };
  if (document.readyState === "complete") afterHydration();
  else (document.defaultView || window).addEventListener("load", afterHydration, { once: true });
}

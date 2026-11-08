import { GUIDED_LABEL, deliver, forgetGuidedMemory, loadMemory, STORAGE_KEY } from "./guided-chat.js";

const KEY = STORAGE_KEY;

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
  section.append(form, log);
  const stack = doc.querySelector("#contenido .stack") || doc.querySelector("#contenido") || body;
  stack.insertBefore(section, stack.firstChild);

  function paint(text) {
    const turn = doc.createElement("p");
    turn.textContent = text;
    log.appendChild(turn);
    status.textContent = text;
    status.scrollIntoView({ block: "nearest" });
  }

  function roleId() {
    return doc.querySelector(".app select")?.value || "core";
  }

  let lastFire = 0;
  let lastText = "";
  function submitText() {
    const text = input.value.trim();
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
    try {
      const result = deliver(text, loadMemory(storage), roleId(), storage);
      const note = result.stored ? "" : `\nNo se pudo guardar en este aparato: ${result.error}`;
      status.dataset.kind = result.stored ? "ready" : "error";
      paint(`Tú: ${text}\nAzum: ${result.text}${note}`);
      input.value = "";
    } catch (error) {
      status.dataset.kind = "error";
      status.textContent = `No se pudo responder: ${error?.message || error}`;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitText();
  });
  send.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") return;
    event.preventDefault();
    submitText();
  });

  forget.addEventListener("click", () => {
    const before = Object.keys(storage);
    forgetGuidedMemory(storage);
    log.textContent = "";
    status.textContent = storage.getItem(KEY) === null
      ? "He olvidado solo esta charla. El resto de datos de este aparato sigue donde estaba."
      : "No pude borrar esta charla.";
    section.dataset.otherKeys = String(before.filter((item) => item !== KEY).length);
  });

  return section;
}

if (typeof document !== "undefined") {
  const start = () => mount(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  const observer = new MutationObserver(() => {
    if (!document.getElementById("azum-guided")) start();
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

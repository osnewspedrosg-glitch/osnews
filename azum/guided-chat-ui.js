import { GUIDED_LABEL, forgetGuidedMemory, loadMemory, respond, saveMemory, STORAGE_KEY } from "./guided-chat.js";

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
  const status = add(doc, section, "p", "azum-guided-status", "Escribe cuando quieras. Lo que cuentes se queda en este aparato.");
  status.id = "azum-guided-status";
  const log = add(doc, section, "div", "azum-guided-log", "");
  log.id = "azum-guided-log";
  const field = doc.createElement("label");
  field.className = "azum-guided-field";
  field.append("Mensaje");
  const input = doc.createElement("textarea");
  input.id = "azum-guided-input";
  input.rows = 3;
  input.maxLength = 400;
  input.placeholder = "Por ejemplo: me llamo Pedro";
  field.appendChild(input);
  const send = doc.createElement("button");
  send.type = "button";
  send.id = "azum-guided-send";
  send.textContent = "Enviar a la charla guiada";
  const forget = doc.createElement("button");
  forget.type = "button";
  forget.id = "azum-guided-forget";
  forget.textContent = "Olvidar esta charla";
  section.append(field, send, forget);
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

  send.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) {
      status.textContent = "Escribe un mensaje.";
      return;
    }
    const memory = loadMemory(storage);
    const result = respond(text, memory, roleId());
    saveMemory(storage, result.memory);
    paint(`Tú: ${text}\nAzum: ${result.text}`);
    input.value = "";
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

import { loadVisitCount, recordVisit, visitLine } from "./visit-counter.js";

export function mount(doc, fetchImpl = doc.defaultView?.fetch?.bind(doc.defaultView)) {
  if (!doc.body || doc.getElementById("azum-visits")) return doc.getElementById("azum-visits");
  const box = doc.createElement("p");
  box.id = "azum-visits";
  box.className = "azum-visits";
  box.textContent = "Visitas de esta página: …";
  const note = doc.createElement("span");
  note.className = "azum-visits-note";
  note.textContent = " Cifra pública de GoatCounter solo para /osnews/azum/. No es el total de OSNews ni una lista de personas.";
  box.appendChild(note);
  const anchor = doc.querySelector("header.top") || doc.querySelector("header") || doc.body;
  anchor.insertAdjacentElement("afterend", box);
  loadVisitCount(fetchImpl).then((result) => {
    box.dataset.state = result.state;
    box.firstChild.textContent = visitLine(result);
  }).catch(() => {
    box.dataset.state = "unavailable";
    box.firstChild.textContent = visitLine({ text: "No disponible" });
  });
  recordVisit(doc);
  return box;
}

if (typeof document !== "undefined") {
  const start = () => mount(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  const observer = new MutationObserver(() => {
    if (!document.getElementById("azum-visits")) start();
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

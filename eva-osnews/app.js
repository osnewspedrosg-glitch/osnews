import {
  createEntry, dossier, dossierText, kindLabel, loadEntries,
  removeEntry, saveEntries, statusLabel, upsertEntry, MAY_DELIVERY,
} from "./logic.js";

const $ = (id) => document.getElementById(id);
let editing = null;

function storage() { return localStorage; }

function showError(text) {
  const box = $("eva-error");
  box.hidden = !text;
  box.textContent = text || "";
}

function readForm() {
  return {
    id: editing,
    title: $("eva-title").value,
    country: $("eva-country").value,
    description: $("eva-description").value,
    factDate: $("eva-date").value,
    kind: $("eva-kind").value,
    status: $("eva-status").value,
    sourcesText: $("eva-urls").value,
    createdAt: $("eva-created").value || undefined,
  };
}

function fillForm(entry) {
  editing = entry?.id || null;
  $("eva-title").value = entry?.title || "";
  $("eva-country").value = entry?.country || "";
  $("eva-description").value = entry?.description || "";
  $("eva-date").value = entry?.factDate || "";
  $("eva-kind").value = entry?.kind || "pendiente";
  $("eva-status").value = entry?.status || "recibida";
  $("eva-urls").value = (entry?.urls || []).join("\n");
  $("eva-created").value = entry?.createdAt || "";
  $("eva-save").textContent = editing ? "Guardar cambios" : "Guardar en este navegador";
  $("eva-form").hidden = false;
}

function paint(entries) {
  const list = $("eva-list");
  list.textContent = "";
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.textContent = "No hay denuncias guardadas. Lo que escribas se queda en este navegador.";
    list.appendChild(empty);
    return;
  }
  for (const entry of entries) {
    const card = document.createElement("article");
    card.className = "card";
    const title = document.createElement("h2");
    title.textContent = entry.title;
    const meta = document.createElement("p");
    meta.textContent = `${entry.country} · ${entry.factDate} · ${kindLabel(entry.kind)} · ${statusLabel(entry.status)}`;
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "Este estado lo marcas tú. MAY no ha decidido. Las fuentes están por contrastar.";
    const body = document.createElement("p");
    body.textContent = entry.description;
    const links = document.createElement("ul");
    for (const href of entry.urls) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = href;
      link.textContent = href;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      item.appendChild(link);
      links.appendChild(item);
    }
    const row = document.createElement("div");
    row.className = "row";
    const edit = button("Editar", () => fillForm(entry));
    const copy = button("Copiar expediente", () => copyDossier(entry));
    const file = button("Descargar JSON", () => downloadDossier(entry));
    const text = button("Descargar texto", () => downloadText(entry));
    const drop = button("Borrar", () => erase(entry.id));
    row.append(edit, copy, file, text, drop);
    card.append(title, meta, note, body, links, row);
    list.appendChild(card);
  }
}

function button(label, action) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "btn";
  node.textContent = label;
  node.addEventListener("click", action);
  return node;
}

function currentEntries() {
  const loaded = loadEntries(storage());
  if (!loaded.ok) showError(loaded.error);
  return loaded.entries;
}

function persist(entries, okMessage) {
  const saved = saveEntries(storage(), entries);
  if (!saved.ok) {
    showError(saved.error);
    return;
  }
  showError("");
  $("eva-status-line").textContent = okMessage;
  paint(entries);
}

function onSave(event) {
  event.preventDefault();
  const made = createEntry(readForm());
  if (!made.ok) {
    showError(made.errors.join(" "));
    return;
  }
  persist(upsertEntry(currentEntries(), made.entry), "Guardado en este navegador.");
  editing = null;
  $("eva-form").reset();
  $("eva-kind").value = "pendiente";
  $("eva-status").value = "recibida";
  $("eva-save").textContent = "Guardar en este navegador";
  $("eva-form").hidden = true;
}

function erase(id) {
  persist(removeEntry(currentEntries(), id), "Borrado de este navegador.");
}

async function copyDossier(entry) {
  const text = dossierText(entry);
  try {
    await navigator.clipboard.writeText(text);
    $("eva-status-line").textContent = "Expediente copiado. No se ha enviado a MAY.";
  } catch (error) {
    showError(`No se pudo copiar: ${error?.message || error}`);
  }
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

function downloadDossier(entry) {
  download(`${entry.id}.json`, JSON.stringify(dossier(entry), null, 2), "application/json");
  $("eva-status-line").textContent = "JSON descargado en este aparato. No se ha enviado a MAY.";
}

function downloadText(entry) {
  download(`${entry.id}.txt`, dossierText(entry), "text/plain");
  $("eva-status-line").textContent = "Texto descargado en este aparato. No se ha enviado a MAY.";
}

function boot() {
  $("eva-connection").textContent = MAY_DELIVERY.label;
  $("eva-missing").textContent = MAY_DELIVERY.missing;
  $("eva-new").addEventListener("click", () => { showError(""); fillForm(null); });
  $("eva-cancel").addEventListener("click", () => { $("eva-form").hidden = true; editing = null; });
  $("eva-form").addEventListener("submit", onSave);
  const loaded = loadEntries(storage());
  if (!loaded.ok) showError(loaded.error);
  paint(loaded.entries);
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      $("eva-status-line").textContent = `La instalación del navegador no se registró: ${error?.message || error}`;
    });
  }
}

boot();

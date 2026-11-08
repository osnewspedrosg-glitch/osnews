/** Local complaint records. Nothing here contacts MAY or a network. */
import { deliverToMay, MAY_DELIVERY } from "./may-adapter.js";

export const STORAGE_KEY = "eva-osnews-entries-v1";
export const KINDS = ["hecho", "opinion", "pendiente"];
export const STATUSES = ["recibida", "pendiente-contraste", "lista-revision-may"];

const KIND_LABEL = { hecho: "Hecho", opinion: "Opinión", pendiente: "Pendiente de clasificar" };
const STATUS_LABEL = {
  recibida: "Recibida",
  "pendiente-contraste": "Pendiente de contraste",
  "lista-revision-may": "Lista para revisión de MAY",
};

export function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

export function sanitizeUrl(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, error: "La fuente está vacía." };
  if (/[\u0000-\u001f\u007f]/.test(raw)) return { ok: false, error: "La URL tiene caracteres de control." };
  let url;
  try { url = new URL(raw); } catch { return { ok: false, error: "No es una URL." }; }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Solo se aceptan enlaces http o https." };
  }
  if (url.username || url.password) return { ok: false, error: "La URL no puede llevar usuario ni clave." };
  return { ok: true, href: url.href };
}

export function parseSourceUrls(text) {
  const parts = String(text ?? "").split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);
  const urls = [];
  const errors = [];
  for (const part of parts) {
    const checked = sanitizeUrl(part);
    if (!checked.ok) errors.push(`${part}: ${checked.error}`);
    else if (!urls.includes(checked.href)) urls.push(checked.href);
  }
  return { urls, errors };
}

function cleanLine(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function createEntry(input, now = new Date().toISOString()) {
  const errors = [];
  const title = cleanLine(input?.title, 160);
  const country = cleanLine(input?.country, 80);
  const description = cleanLine(input?.description, 4000);
  const factDate = String(input?.factDate ?? "").trim();
  const kind = KINDS.includes(input?.kind) ? input.kind : "";
  const status = STATUSES.includes(input?.status) ? input.status : "recibida";
  if (title.length < 3) errors.push("El título es demasiado corto.");
  if (country.length < 2) errors.push("Falta el país.");
  if (description.length < 10) errors.push("La descripción es demasiado corta.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(factDate)) errors.push("La fecha del hecho debe ser AAAA-MM-DD.");
  if (!kind) errors.push("Elige si es un hecho, una opinión o si aún está pendiente.");
  const sources = parseSourceUrls(input?.sourcesText ?? "");
  errors.push(...sources.errors);
  if (!sources.urls.length) errors.push("Hace falta al menos un enlace http o https.");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    entry: {
      id: input?.id || `eva-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title, country, description, factDate, kind, status,
      urls: sources.urls,
      createdAt: input?.createdAt || now,
      updatedAt: now,
      mayDecision: null,
    },
  };
}

export function loadEntries(storage) {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return { ok: false, entries: [], error: "La memoria local no tiene una lista válida." };
    return { ok: true, entries: data, error: null };
  } catch {
    return { ok: false, entries: [], error: "No se pudo leer la memoria de este navegador." };
  }
}

export function saveEntries(storage, entries) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: `No se pudo guardar: ${error?.message || error}` };
  }
}

export function upsertEntry(entries, entry) {
  const next = entries.filter((item) => item.id !== entry.id);
  next.unshift(entry);
  return next;
}

export function removeEntry(entries, id) {
  return entries.filter((item) => item.id !== id);
}

export function kindLabel(kind) { return KIND_LABEL[kind] || kind; }
export function statusLabel(status) { return STATUS_LABEL[status] || status; }

export function dossier(entry) {
  return {
    aviso: "Expediente local para entrega manual. MAY no lo ha recibido ni ha decidido. Las fuentes están por contrastar.",
    conexionMay: MAY_DELIVERY.label,
    id: entry.id,
    titulo: entry.title,
    pais: entry.country,
    fechaHecho: entry.factDate,
    clasificacion: kindLabel(entry.kind),
    estadoMarcadoPorQuienEscribe: statusLabel(entry.status),
    decisionMay: null,
    descripcion: entry.description,
    fuentesPorContrastar: entry.urls,
    actualizado: entry.updatedAt,
  };
}

export function dossierText(entry) {
  const data = dossier(entry);
  return [
    data.aviso,
    data.conexionMay,
    `Título: ${data.titulo}`,
    `País: ${data.pais}`,
    `Fecha del hecho: ${data.fechaHecho}`,
    `Clasificación de quien escribe: ${data.clasificacion}`,
    `Estado marcado por quien escribe: ${data.estadoMarcadoPorQuienEscribe}`,
    "Decisión de MAY: ninguna",
    `Descripción: ${data.descripcion}`,
    "Fuentes por contrastar:",
    ...data.fuentesPorContrastar.map((url) => `- ${url}`),
  ].join("\n");
}

export { deliverToMay, MAY_DELIVERY };

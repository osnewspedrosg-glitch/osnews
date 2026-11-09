/**
 * Delivery to MAY through a Cloudflare Worker relay. The page only knows the
 * relay URL; the Grok Bot webhook URL and key are Worker secrets and never
 * reach the browser. Receiving a dossier is not publishing it.
 *
 * CONNECTED stays false until a real end-to-end test (PRUEBA FICTICIA)
 * reaches Eva OSNews. Flip it only after that test.
 */
export const RELAY_URL = "https://eva-osnews-entrega.osnews-may.workers.dev/expediente";
export const CONNECTED = false;

export const MAY_DELIVERY = {
  connected: CONNECTED,
  relay: RELAY_URL,
  label: CONNECTED ? "Conexión con MAY: conectada (revisión, no publicación automática)" : "Conexión con MAY: no conectada",
  missing: CONNECTED
    ? "Puedes enviar un expediente para revisión. Recibirlo no significa publicarlo; MAY decidirá tras contrastar."
    : "La entrega a MAY está en pruebas. Si el envío falla, tu copia local se conserva y puedes copiar o descargar el expediente.",
};

export const PRIVACY_NOTICE = "Antes de enviar: no pongas datos personales (tuyos ni de terceros). No publicaremos tu identidad, pero no garantizamos anonimato técnico: el envío pasa por Internet y por servidores de terceros. ¿Enviar a MAY para revisión?";
export const SENT_MESSAGE = "Enviado para revisión. Recibirlo no significa publicarlo; MAY decidirá tras contrastar.";

export function payloadFor(entry) {
  return {
    id: entry.id,
    title: entry.title,
    country: entry.country,
    factDate: entry.factDate,
    description: entry.description,
    urls: entry.urls,
    kind: entry.kind,
    status: entry.status,
  };
}

export async function deliverToMay(entry, fetchImpl = globalThis.fetch) {
  if (!RELAY_URL || typeof fetchImpl !== "function") {
    return { ok: false, sent: false, reason: "La entrega a MAY no está disponible. Tu copia local sigue guardada." };
  }
  let response;
  try {
    response = await fetchImpl(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadFor(entry)),
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  } catch {
    return { ok: false, sent: false, reason: "No se pudo enviar (sin conexión, servicio caído o envío bloqueado por el navegador). Tu copia local sigue guardada." };
  }
  let data = {};
  try { data = await response.json(); } catch {}
  if (response.ok && data.ok) return { ok: true, sent: true, message: SENT_MESSAGE };
  const detail = typeof data.error === "string" ? data.error : `Error ${response.status}.`;
  return { ok: false, sent: false, reason: `No se ha enviado: ${detail} Tu copia local sigue guardada.` };
}

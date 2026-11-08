/**
 * Pending adapter. The repo documents an optional chat proxy (`?may=` or
 * `window.MAY_API` with `/api/may`) that is not included here, and
 * azum-gemini/README.md says not to publish a public proxy. There is no
 * documented inbox that can receive a dossier without a key in the page.
 * This function never pretends a delivery happened.
 */
export const MAY_DELIVERY = {
  connected: false,
  label: "Conexión con MAY: no conectada",
  documented: [
    "README.md: el sitio estático no tiene servidor. Una IA externa exigiría un proxy aparte con /api/may.",
    "index.html de OSNews: sin ese proxy, MAY no está en línea.",
    "azum-gemini/README.md: no desplegar ese proceso en un hosting público.",
  ],
  missing: "Falta un destino documentado, sin clave en el navegador, que acepte el expediente y deje la decisión a MAY. Hasta entonces la entrega es manual: copiar o descargar el archivo.",
};

export function deliverToMay() {
  return { ok: false, sent: false, reason: MAY_DELIVERY.label };
}

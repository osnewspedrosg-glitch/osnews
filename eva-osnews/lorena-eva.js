/**
 * Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews) · conexión con Eva OSNews.
 * Eva lee el título y la descripción de la denuncia (solo en este navegador), estima la
 * emoción con el Módulo Lorena y responde con inteligencia emocional. Nada sale del aparato.
 */
export function evaBaseReply(entry) {
  const title = String(entry?.title ?? "").trim().slice(0, 160) || "tu denuncia";
  return `He guardado «${title}» en este navegador para contrastarla. Aún no se ha enviado a MAY y no se publica sola.`;
}

export function evaLorenaReply(lorena, entry) {
  const base = evaBaseReply(entry);
  if (!lorena) return { text: base, analysis: null };
  const text = `${entry?.title ?? ""}. ${entry?.description ?? ""}`;
  const shaped = lorena.respond(text, base, { lang: "es" });
  return { text: shaped.text, analysis: shaped.analysis, tone: shaped.tone };
}

export function createEvaLorena(storage) {
  const L = globalThis.OSN_LORENA;
  if (!L) return null;
  return L.create({ app: "eva", assistant: "Eva", storage });
}

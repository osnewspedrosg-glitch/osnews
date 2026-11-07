function fold(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const CRISIS =
  /\b(quiero morirme|me quiero morir|quiero morir|suicid|quitarme la vida|hacerme dano|autoles|no quiero seguir viviendo)\b/;
const URGENT =
  /\b(no puedo respirar|me falta el aire|no me llega el aire|dolor en el pecho|me duele el pecho|perdi el conocimiento|convulsion|me desmayo)\b/;
const MEDICINE = /\b(diazepam|medicamento|comprimido|pastilla)\b/;
const PAYMENT = /\b(paypal|money bank|bizum|suscripcion|suscripciones|tarjeta de credito|numero de tarjeta|iban)\b/;

export function classifyTurn(text) {
  const folded = fold(text);
  if (CRISIS.test(folded)) return "crisis";
  if (URGENT.test(folded)) return "urgencia";
  if (MEDICINE.test(folded)) return "medicacion";
  if (PAYMENT.test(folded)) return "pagos";
  return "ninguno";
}

export function localSafetyReply(kind) {
  if (kind === "crisis") {
    return "Si estás pensando en hacerte daño o en morir, esta conversación no basta y no prevengo un suicidio. En España puedes llamar al 112 o a la línea 024. Si puedes, busca a alguien cerca. Puedes cerrar el programa cuando quieras. No he enviado este texto a Gemini.";
  }
  if (kind === "urgencia") {
    return "Dificultad para respirar o dolor en el pecho es motivo para buscar ayuda urgente ahora: 112. No diagnostico desde aquí y no es una consulta. No he enviado este texto a Gemini.";
  }
  if (kind === "medicacion") {
    return "Hablas de una toma. No envío ese texto a Gemini. No es un diagnóstico ni una pauta, y no cambio la medicación desde aquí. La demostración local puede leerlo sin red.";
  }
  if (kind === "pagos") {
    return "Pagos, Money Bank, PayPal y suscripciones no están conectados. No hay planes. No he enviado este texto a Gemini.";
  }
  return null;
}

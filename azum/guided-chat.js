/**
 * Guided Azum conversation. The lines are programmed. They are not model output
 * and they do not call Copilot, Grok or any other cloud service.
 */
export const GUIDED_ROLES = [
  ["core", "MAY CORE", "activo"],
  ["isabella", "ISABELLA", "activo"],
  ["eva", "EVA", "activo"],
  ["katy", "KATY", "borrador"],
  ["nova", "NOVA", "borrador"],
  ["athena", "ATHENA", "borrador"],
  ["luna", "LUNA", "borrador"],
  ["aria", "ARIA", "borrador"],
  ["vigia", "VIGÍA", "parcial"],
  ["oraculo", "ORÁCULO", "borrador"],
  ["industrial", "MAY INDUSTRIAL", "borrador"],
  ["home", "MAY HOME", "borrador"],
  ["health", "MAY HEALTH", "borrador"],
].map(([id, name, status]) => ({ id, name, status }));

export const GUIDED_LABEL = "Conversación guiada · respuestas programadas, no IA generativa";
export const STORAGE_KEY = "azum-guided-memory-v1";

const STOP = new Set(["una", "un", "el", "la", "de", "muy", "tan", "triste", "feliz", "solo", "sola", "ia", "robot", "azum"]);

export function emptyMemory() {
  return { name: null, origin: null, job: null, feeling: null, asked: [] };
}

export function loadMemory(storage) {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    if (!data || typeof data !== "object") return emptyMemory();
    return {
      name: cleanFact(data.name),
      origin: cleanFact(data.origin),
      job: cleanFact(data.job),
      feeling: cleanFact(data.feeling),
      asked: Array.isArray(data.asked) ? data.asked.filter((item) => typeof item === "string").slice(0, 8) : [],
    };
  } catch {
    return emptyMemory();
  }
}

export function saveMemory(storage, memory) {
  storage.setItem(STORAGE_KEY, JSON.stringify({
    name: memory.name,
    origin: memory.origin,
    job: memory.job,
    feeling: memory.feeling,
    asked: memory.asked,
  }));
}

export function forgetGuidedMemory(storage) {
  storage.removeItem(STORAGE_KEY);
}

function cleanFact(value) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 80) : null;
}

function fold(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function title(text) {
  const clean = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return null;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function markAsked(memory, key) {
  if (!memory.asked.includes(key)) memory.asked.push(key);
}

function nextQuestion(memory) {
  if (!memory.name && !memory.asked.includes("name")) return { key: "name", text: "¿Cómo te llamas?" };
  if (!memory.origin && !memory.asked.includes("origin")) return { key: "origin", text: "¿De dónde eres?" };
  if (!memory.job && !memory.asked.includes("job")) return { key: "job", text: "¿A qué te dedicas?" };
  return null;
}

function captureName(raw, current) {
  const all = [...String(raw).matchAll(/(?:me llamo|mi nombre es|ll[aá]mame)\s+(\p{L}{2,24})/giu)];
  if (!all.length) return undefined;
  const candidate = all[all.length - 1][1];
  if (STOP.has(fold(candidate))) return undefined;
  if (all.length === 1 && /\bno me llamo\b/.test(fold(raw)) && current && fold(current) === fold(candidate)) return null;
  return title(candidate);
}

function captureOrigin(raw) {
  const match = String(raw).match(/(?:soy de|vivo en|vengo de)\s+([\p{L}][\p{L}\s]{1,30})$/iu);
  if (!match) return null;
  return title(match[1].replace(/\b(no|me|llamo|dedico|siento)\b.*$/i, "").trim());
}

function captureJob(raw) {
  const match = String(raw).match(/(?:me dedico a|trabajo de|trabajo como)\s+([\p{L}][\p{L}\s]{1,40})$/iu);
  if (!match) return null;
  return match[1].trim();
}

function captureFeeling(folded) {
  if (/\bsoledad\b|\bme siento sol[oa]\b|\bestoy sol[oa]\b|\bsiento soledad\b/.test(folded)) return "soledad";
  if (/\btriste\b|\bllorando\b/.test(folded)) return "tristeza";
  if (/\bansiedad\b|\bagobiad/.test(folded)) return "ansiedad";
  if (/\bmiedo\b|\basustad/.test(folded)) return "miedo";
  if (/\bbien\b|\btranquilo\b|\btranquila\b|\bmejor\b/.test(folded) && /\b(siento|estoy|me siento)\b/.test(folded)) return "bien";
  return null;
}

function roleLine(role) {
  if (!role) return "";
  if (role.id === "athena") return " Pagos: No conectado. No hay saldo ni movimiento.";
  if (role.status !== "activo") return ` El papel ${role.name} está en ${role.status} y su función no está activada.`;
  if (role.id === "health") return " El control sanitario no está activado.";
  return "";
}

function moneyAsked(folded) {
  return /\b(saldo|paypal|money bank|suscripcion|pagar|pago|cobro|recibo)\b/.test(folded);
}

function recall(folded, memory) {
  if (/\b(como me llamo|cual es mi nombre|recuerdas mi nombre)\b/.test(folded)) {
    return memory.name ? `Me dijiste que te llamas ${memory.name}. Está guardado solo en este aparato.` : "Todavía no me has dicho cómo te llamas.";
  }
  if (/\b(de donde soy|cual es mi origen|de donde vengo|donde vivo)\b/.test(folded)) {
    return memory.origin ? `Me dijiste que eres de ${memory.origin}. Está guardado solo en este aparato.` : "Todavía no me has dicho de dónde eres.";
  }
  if (/\b(a que me dedico|cual es mi trabajo|en que trabajo|a que trabajo)\b/.test(folded)) {
    return memory.job ? `Me dijiste que te dedicas a ${memory.job}. Está guardado solo en este aparato.` : "Todavía no me has dicho a qué te dedicas.";
  }
  if (/\b(como me siento|que siento|como me sentia|que te dije que sentia)\b/.test(folded)) {
    return memory.feeling ? `Me dijiste que te sentías en ${memory.feeling}. Es un apunte programado, no una medición.` : "Todavía no me has dicho cómo te sientes.";
  }
  if (/\b(que sabes de mi|que recuerdas)\b/.test(folded)) {
    const bits = [];
    if (memory.name) bits.push(`te llamas ${memory.name}`);
    if (memory.origin) bits.push(`eres de ${memory.origin}`);
    if (memory.job) bits.push(`te dedicas a ${memory.job}`);
    if (memory.feeling) bits.push(`dijiste que te sentías en ${memory.feeling}`);
    return bits.length
      ? `Recuerdo esto, solo en este aparato: ${bits.join("; ")}.`
      : "Todavía no tengo datos tuyos. Lo que me cuentes se queda solo en este aparato.";
  }
  return null;
}

export function respond(text, memory, roleOrId = "core") {
  const role = typeof roleOrId === "string" ? GUIDED_ROLES.find((item) => item.id === roleOrId) : roleOrId;
  const next = {
    name: memory?.name ?? null,
    origin: memory?.origin ?? null,
    job: memory?.job ?? null,
    feeling: memory?.feeling ?? null,
    asked: Array.isArray(memory?.asked) ? memory.asked.slice() : [],
  };
  const folded = fold(text);
  const known = new Set(next.asked);
  let answer = "";
  let askedNow = false;

  const renamed = captureName(text, next.name);
  if (renamed !== undefined) {
    next.name = renamed;
    answer = renamed
      ? `Encantada, ${renamed}. Soy Azum, un programa de esta página.`
      : "De acuerdo, olvido el nombre que tenía apuntado.";
  }
  const origin = captureOrigin(text);
  if (origin) {
    next.origin = origin;
    answer = (answer ? answer + " " : "") + `¡${origin}! Qué sitio tan bonito.`;
  }
  const job = captureJob(text);
  if (job) {
    next.job = job;
    answer = (answer ? answer + " " : "") + `Apunto que te dedicas a ${job}.`;
  }
  const feeling = captureFeeling(folded);
  if (feeling) {
    next.feeling = feeling;
    const care = feeling === "soledad"
      ? "Gracias por decirlo. No soy una persona y no siento soledad: esta frase está programada. Si puedes, cuéntaselo también a alguien cercano."
      : `Apunto que dices sentirte en ${feeling}. No es una medición ni una emoción mía.`;
    answer = (answer ? answer + " " : "") + care;
    askedNow = true;
  }

  const remembered = recall(folded, next);
  if (remembered && !renamed && !origin && !job && !feeling) answer = remembered;

  if (/\b(quien eres|como te llamas|que eres|eres humano|eres persona|eres copilot|eres grok|eres gemini)\b/.test(folded)) {
    answer = "Soy Azum, el programa de esta página. Esta conversación usa respuestas programadas. No soy Copilot, Grok ni una persona, y no estoy conectada a ellos.";
  }

  if (moneyAsked(folded)) {
    answer = "Pagos: No conectado. No hay saldo, recibo ni movimiento.";
  } else if (role?.id === "health" && /\b(dosis|diagnostico|pastilla|tratamiento|medico)\b/.test(folded)) {
    answer = "El control sanitario no está activado. No doy pautas ni diagnósticos.";
  } else if (!answer) {
    answer = "No tengo una respuesta programada para eso. No invento datos. Puedo recordar tu nombre, de dónde eres, a qué te dedicas y cómo dices que te sientes.";
  }

  if (!askedNow && !remembered && !moneyAsked(folded)) {
    const follow = nextQuestion(next);
    if (follow && !known.has(follow.key) && (renamed || origin || job || /^(hola|buenas|hey)\b/.test(folded))) {
      answer = `${answer} ${follow.text}`;
      markAsked(next, follow.key);
    }
  }

  answer += roleLine(role);
  return { text: answer.replace(/\s+/g, " ").trim(), memory: next, label: GUIDED_LABEL, roleId: role?.id ?? "core" };
}

export function roleIds() {
  return GUIDED_ROLES.map((role) => role.id);
}

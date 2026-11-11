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
  if (!role || role.status === "activo") return "";
  return ` El papel ${role.name} está en ${role.status} y su función no está activada.`;
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
      : `Apunto que ${({
        tristeza: "dices que estás triste",
        soledad: "dices que te sientes en soledad",
        ansiedad: "dices que estás agobiado o agobiada",
        miedo: "dices que tienes miedo",
        bien: "dices que estás bien",
      }[feeling] || "dices cómo te sientes")}. No es una medición ni una emoción mía.`;
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
  } else if (/^(hola|hello|hey|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(folded)) {
    answer = next.name
      ? `Hola, ${next.name}. Soy Azum, el programa de esta página.`
      : "Hola. Soy Azum, el programa de esta página.";
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

  if (!moneyAsked(folded)) answer += roleLine(role);
  return { text: answer.replace(/\s+/g, " ").trim(), memory: next, label: GUIDED_LABEL, roleId: role?.id ?? "core" };
}

export function roleIds() {
  return GUIDED_ROLES.map((role) => role.id);
}

export function deliver(text, memory, role, storage) {
  const result = respond(text, memory, role);
  try {
    saveMemory(storage, result.memory);
    return { ...result, stored: true, error: null };
  } catch (error) {
    return { ...result, stored: false, error: String(error?.message || error) };
  }
}

/**
 * Azum is the router. For each user message there is one decision and one reply:
 * 1) Módulo Lorena analyzes (emotion, intensity, trend, both memories);
 * 2) Azum uses that analysis to pick a single role/reply;
 * 3) Lorena adapts the tone of that same reply and must not add another.
 *
 * An explicit papel lógico other than the default «core» is respected.
 * From «core», distress detected by Lorena may be routed to EVA (activo).
 * Draft roles are never auto-selected.
 */
export function chooseRole(preferredRole, analysis, memories) {
  const requested = typeof preferredRole === "string"
    ? GUIDED_ROLES.find((item) => item.id === preferredRole)
    : preferredRole;
  const requestedId = requested?.id || "core";
  if (requestedId !== "core") return requestedId;

  const emotion = analysis?.emotion || "";
  const intensity = Number(analysis?.intensity) || 0;
  const trend = analysis?.trend;
  const valence = analysis?.valence;
  const last = memories?.user?.last;
  const lastValence = last
    ? (typeof last.v === "number" ? last.v
      : typeof last.valence === "number" && typeof last.i === "number" ? last.valence * last.i
      : typeof last.valence === "number" ? last.valence
      : null)
    : null;
  const worsening = trend === "empeora" || (typeof lastValence === "number" && valence < 0 && valence < lastValence);
  if ((/^(tristeza|soledad|ansiedad|miedo)$/.test(emotion) && intensity >= 4) || (worsening && valence < 0 && intensity >= 3)) {
    return "eva";
  }
  return "core";
}

export const DECISION_KEY = "azum-decision-log-v1";

export function loadDecisions(storage) {
  try {
    const data = JSON.parse(storage.getItem(DECISION_KEY) || "[]");
    return Array.isArray(data) ? data.slice(-30) : [];
  } catch {
    return [];
  }
}

export function clearDecisions(storage) {
  storage.removeItem(DECISION_KEY);
}

function rolesToAsk(preferred) {
  const pref = (typeof preferred === "string" ? preferred : preferred?.id) || "core";
  const out = [];
  const seen = new Set();
  const add = (id) => {
    const role = GUIDED_ROLES.find((item) => item.id === id);
    if (role && !seen.has(role.id)) { seen.add(role.id); out.push(role); }
  };
  add(pref);
  ["core", "isabella", "eva"].forEach(add);
  return out;
}

export function scoreCandidate(cand, analysis, memories, lastReplies) {
  let s = cand.status === "activo" ? 0.7 : 0.4;
  if (cand.status === "borrador") s -= 0.25;
  const emo = analysis?.emotion || "";
  const intensity = Number(analysis?.intensity) || 0;
  if (cand.roleId === "eva" && /^(tristeza|soledad|miedo)$/.test(emo)) s += 0.35 * (intensity / 10);
  if (cand.roleId === "core") s += 0.12;
  if (analysis?.machista?.detected && cand.roleId === "core") s += 0.3;
  if (analysis?.distress === "crisis" && cand.roleId === "eva") s += 0.25;
  if (cand.roleId === "health" && !/\b(dosis|diagnostico|medico|salud)\b/.test((cand.text || "").toLowerCase())) s -= 0.4;
  const prev = lastReplies || [];
  if (prev.some((t) => t && cand.text && t.slice(0, 48) === cand.text.slice(0, 48))) s -= 0.35;
  return Math.round(s * 100) / 100;
}

/**
 * Un envío: Lorena analiza; Azum pide a cada candidato, uno detrás de otro,
 * una respuesta; las puntúa (emoción, repetición, seguridad) y elige una.
 * Lorena solo adapta esa respuesta. Azum decide también el modo Eva/Lorena
 * con el análisis y el historial.
 */
export function dispatch(text, memory, role, storage, lorena) {
  const analysis = lorena && typeof lorena.analyze === "function" ? lorena.analyze(text) : null;
  const memories = lorena && typeof lorena.memory === "function" ? lorena.memory() : null;
  const modeDec = lorena && typeof lorena.decideMode === "function"
    ? lorena.decideMode(analysis)
    : { mode: "lorena", modeLabel: "modo Lorena", reasons: [], scores: {} };

  const candidates = [];
  const asked = rolesToAsk(role);
  for (let i = 0; i < asked.length; i += 1) {
    const item = asked[i];
    const raw = respond(text, memory, item.id);
    candidates.push({
      roleId: item.id,
      status: item.status,
      text: raw.text,
      memory: raw.memory,
      confidence: item.status === "activo" ? 0.7 : 0.4,
    });
  }
  const lastReplies = loadDecisions(storage).map((d) => d.reply).filter(Boolean);
  const scored = candidates.map((c) => ({ ...c, score: scoreCandidate(c, analysis, memories, lastReplies) }));
  scored.sort((a, b) => b.score - a.score);
  const requestedId = (typeof role === "string" ? role : role?.id) || "core";
  let winner = scored[0] || { text: "", memory, roleId: "core" };
  if (requestedId !== "core") {
    const forced = scored.find((c) => c.roleId === requestedId);
    if (forced) winner = forced;
  }

  let stored = true, error = null;
  try {
    if (winner.memory) saveMemory(storage, winner.memory);
  } catch (err) {
    stored = false;
    error = String(err?.message || err);
  }

  if (lorena && typeof lorena.respond === "function") {
    const shaped = lorena.respond(text, winner.text, { lang: "es", mode: modeDec.mode });
    if (shaped && typeof shaped.text === "string") {
      winner.text = shaped.text;
      if (shaped.tone) winner.tone = shaped.tone;
    }
  }

  const entry = {
    t: Date.now(),
    user: String(text || "").slice(0, 180),
    picked: winner.roleId,
    mode: modeDec.mode,
    modeLabel: modeDec.modeLabel,
    reasons: modeDec.reasons || [],
    emotion: analysis?.emotion || null,
    intensity: analysis?.intensity ?? null,
    machista: !!(analysis?.machista && analysis.machista.detected),
    candidates: scored.map((c) => ({ role: c.roleId, score: c.score })),
    reply: String(winner.text || "").slice(0, 220),
  };
  try {
    const log = loadDecisions(storage);
    log.push(entry);
    storage.setItem(DECISION_KEY, JSON.stringify(log.slice(-30)));
  } catch {
    /* el registro de decisión es local y opcional */
  }

  return {
    text: winner.text,
    memory: winner.memory,
    stored,
    error,
    analysis,
    chosenRole: winner.roleId,
    requestedRole: (typeof role === "string" ? role : role?.id) || "core",
    mode: modeDec.mode,
    modeLabel: modeDec.modeLabel,
    tone: winner.tone,
    decision: entry,
    candidates: scored.map((c) => ({ roleId: c.roleId, score: c.score })),
  };
}

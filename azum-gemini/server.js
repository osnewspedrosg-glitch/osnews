import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { evaluatePolicy, publicStatus } from "./policy.js";
import { estimateReservationMicros, readBudget, reserveBudget, settleBudget } from "./budget.js";
import { roleById, systemInstruction } from "./roles.js";
import { classifyTurn, localSafetyReply } from "./safety.js";
import { generateTurn } from "./gemini-client.js";
import { RateLimiter, bucketId } from "./rate-limit.js";

const AZUM_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../azum");
const BODY_LIMIT = 12_000;
const TEXT_LIMIT = 2_000;
const HISTORY_LIMIT = 6;

const MESSAGES = {
  consent_required: "Falta el consentimiento. No se ha enviado nada.",
  gate_required: "Falta la contraseña del puente. No se ha enviado nada.",
  gate_rejected: "La contraseña del puente no coincide. No se ha enviado nada.",
  closed:
    "Gemini no está conectado. El puente sigue cerrado: falta un nivel gratuito confirmado, o la región, la facturación o el modelo no cumplen las condiciones. No hay paso a un servicio de pago.",
  eea: "El puente no llama a Gemini desde el EEE, Suiza o el Reino Unido sin un Paid Service. Esta autorización no permite activar facturación, así que la llamada queda cerrada.",
  validation: "El turno no es válido. No se ha enviado nada.",
  too_large: "El texto es demasiado largo para el puente gratuito.",
  rate: "El puente ha alcanzado su límite local para no gastar la cuota. Espera y vuelve a intentarlo. No se cambia a un plan de pago.",
  gemini_quota:
    "La cuota gratuita de Gemini está agotada o el proyecto está limitado. No hay paso automático a un servicio de pago. La demostración local sigue disponible y no se ha activado facturación desde aquí.",
  gemini_not_free:
    "Gemini no aceptó la llamada en el nivel gratuito. No se reintenta con otro modelo ni con facturación.",
  gemini_timeout: "Gemini no respondió a tiempo. No se reintenta. La demostración local sigue disponible.",
  gemini_blocked: "Gemini bloqueó la respuesta con sus filtros. No se reintenta.",
  gemini_empty: "Gemini no devolvió texto. No se reintenta con otro modelo.",
  gemini_error: "Gemini no completó la llamada. No se reintenta con otro modelo ni con un plan de pago.",
  local_budget_reached:
    "Este puente ha llegado a su tope local del mes. No llama a Gemini. Ese tope es solo de este proceso: no frena la factura de Google, otras claves ni otros proyectos.",
  budget_unavailable: "El puente no puede comprobar su contabilidad local, así que no llama a Gemini.",
  internal: "El puente no pudo completar la petición. La demostración local sigue disponible.",
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

export function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Z0-9_]+$/.test(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function redact(value, secrets) {
  const hidden = secrets.filter(Boolean);
  const walk = (item) => {
    if (typeof item === "string") {
      let text = item;
      for (const secret of hidden) text = text.split(secret).join("[redacted]");
      return text;
    }
    if (Array.isArray(item)) return item.map(walk);
    if (item && typeof item === "object") {
      return Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, walk(entry)]));
    }
    return item;
  };
  return walk(value);
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(Object.assign(new Error("too-large"), { code: "too-large" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function loopbackOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function resolveStatic(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  let rel = null;
  if (pathname === "/osnews/azum" || pathname === "/osnews/azum/") rel = "index.html";
  else if (pathname.startsWith("/osnews/azum/")) rel = pathname.slice("/osnews/azum/".length);
  else return null;
  if (!rel || rel.includes("\0")) return null;
  const full = path.resolve(AZUM_ROOT, rel);
  if (full !== AZUM_ROOT && !full.startsWith(AZUM_ROOT + path.sep)) return null;
  return full;
}

function bearer(req) {
  const header = String(req.headers.authorization ?? "");
  const match = header.match(/^Bearer\s+(\S+)\s*$/i);
  return match ? match[1] : "";
}

function normalizeHistory(history) {
  if (history == null) return [];
  if (!Array.isArray(history) || history.length > HISTORY_LIMIT) return null;
  const contents = [];
  for (const turn of history) {
    if (!turn || (turn.role !== "user" && turn.role !== "model")) return null;
    const text = String(turn.text ?? "").trim();
    if (!text || text.length > TEXT_LIMIT) return null;
    contents.push({ role: turn.role, parts: [{ text }] });
  }
  return contents;
}

export function createAzumGeminiServer(options = {}) {
  const env = options.env ?? process.env;
  const policy = evaluatePolicy(env);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const log = options.log ?? (() => {});
  const limiter = options.limiter ?? new RateLimiter({ rpm: policy.rpm, rpd: policy.rpd, now: options.now });
  const gate = String(env.AZUM_GATE_SECRET ?? "");
  const apiKey = String(env.GEMINI_API_KEY ?? "");
  const secrets = [apiKey, gate];

  function emit(event) {
    log(redact(event, secrets));
  }

  async function handle(req, res) {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (!loopbackOrigin(req.headers.origin)) {
      sendJson(res, 403, { ok: false, code: "origin-rejected", text: MESSAGES.closed, live: false, transmitted: false });
      return;
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": req.headers.origin,
        "access-control-allow-headers": "authorization, content-type",
        "access-control-allow-methods": "GET, POST",
        vary: "Origin",
        "cache-control": "no-store",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/azum/gemini/status") {
      emit({ event: "status", mode: policy.mode, live: policy.live });
      const body = publicStatus(policy);
      if (policy.ledgerPath && policy.capEurMicros != null) {
        try {
          body.budget = await readBudget(policy.ledgerPath, policy.capEurMicros, options.now);
          if (BigInt(body.budget.remainingEurMicros) <= 0n) body.callAllowed = false;
        } catch {
          body.budget = { ...body.budget, readable: false, countedEur: null, remainingEur: null };
          body.callAllowed = false;
        }
      }
      sendJson(res, 200, body);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/azum/gemini/turn") {
      await handleTurn(req, res);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      const file = resolveStatic(url.pathname);
      if (!file) {
        sendJson(res, 404, { ok: false, code: "not-found" });
        return;
      }
      let stat;
      try {
        stat = fs.statSync(file);
      } catch {
        sendJson(res, 404, { ok: false, code: "not-found" });
        return;
      }
      if (!stat.isFile()) {
        sendJson(res, 404, { ok: false, code: "not-found" });
        return;
      }
      res.writeHead(req.method === "HEAD" ? 200 : 200, {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(file).pipe(res);
      return;
    }

    sendJson(res, 405, { ok: false, code: "method" });
  }

  async function handleTurn(req, res) {
    let raw;
    try {
      raw = await readBody(req);
    } catch (error) {
      const code = error?.code === "too-large" ? "too_large" : "validation";
      sendJson(res, code === "too_large" ? 413 : 400, {
        ok: false,
        code,
        text: MESSAGES[code],
        live: false,
        transmitted: false,
        source: "local-policy",
      });
      return;
    }

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      sendJson(res, 400, {
        ok: false,
        code: "validation",
        text: MESSAGES.validation,
        live: false,
        transmitted: false,
        source: "local-policy",
      });
      return;
    }

    if (body?.consent !== true) {
      sendJson(res, 400, {
        ok: false,
        code: "consent_required",
        text: MESSAGES.consent_required,
        live: false,
        transmitted: false,
        source: "local-policy",
      });
      return;
    }

    if (!gate || gate.length < 16) {
      sendJson(res, 401, {
        ok: false,
        code: "gate_required",
        text: MESSAGES.gate_required,
        live: false,
        transmitted: false,
        source: "local-policy",
      });
      return;
    }
    if (!safeEqual(bearer(req), gate)) {
      emit({ event: "turn", code: "gate_rejected" });
      sendJson(res, 401, {
        ok: false,
        code: "gate_rejected",
        text: MESSAGES.gate_rejected,
        live: false,
        transmitted: false,
        source: "local-policy",
      });
      return;
    }

    const role = roleById(body.role);
    const text = String(body.text ?? "").trim();
    const history = normalizeHistory(body.history);
    if (!role || !text || text.length > TEXT_LIMIT || !history || body.model) {
      sendJson(res, 400, {
        ok: false,
        code: "validation",
        text: MESSAGES.validation,
        live: false,
        transmitted: false,
        source: "local-policy",
      });
      return;
    }

    const safety = classifyTurn(text);
    const historySafety = history.some((turn) => classifyTurn(turn.parts[0].text) !== "ninguno");
    const safetyText = localSafetyReply(safety);
    if (safetyText || historySafety) {
      emit({ event: "turn", code: "local-safety", kind: safetyText ? safety : "historial" });
      sendJson(res, 200, {
        ok: true,
        code: "local_safety",
        source: "local-safety",
        live: false,
        transmitted: false,
        verifiedAccount: false,
        role: role.id,
        text: safetyText || "El historial de este panel incluye un tema que no envío a Gemini. No se ha transmitido nada.",
        model: null,
        paidFallback: false,
      });
      return;
    }

    const limit = limiter.take(bucketId(gate));
    if (!limit.ok) {
      emit({ event: "turn", code: "rate", scope: limit.scope });
      sendJson(res, 429, {
        ok: false,
        code: "bridge_rate_limit",
        text: MESSAGES.rate,
        live: false,
        transmitted: false,
        source: "local-policy",
        paidFallback: false,
      });
      return;
    }

    if (policy.mode === "mock" && policy.ok) {
      emit({ event: "turn", code: "mock", role: role.id });
      sendJson(res, 200, {
        ok: true,
        code: "mock",
        source: "mock",
        live: false,
        transmitted: false,
        verifiedAccount: false,
        role: role.id,
        model: null,
        paidFallback: false,
        text: `Simulación del puente, no es Gemini. Papel ${role.name}: he leído ${text.length} caracteres en este ordenador y no los he enviado a ningún modelo. La demostración local sigue siendo el motor sin red.`,
      });
      return;
    }

    if (!policy.live) {
      const eea = policy.reasons.includes("eea-ch-uk-paid-services-only");
      emit({ event: "turn", code: eea ? "eea" : "closed" });
      sendJson(res, 403, {
        ok: false,
        code: eea ? "eea-ch-uk-paid-services-only" : "closed",
        text: eea ? MESSAGES.eea : MESSAGES.closed,
        live: false,
        transmitted: false,
        source: "local-policy",
        reasons: policy.reasons,
        paidFallback: false,
      });
      return;
    }

    const contents = history.concat([{ role: "user", parts: [{ text }] }]);
    const system = systemInstruction(role);
    const reservationMicros = estimateReservationMicros({ system, contents });
    let reservation;
    try {
      reservation = await reserveBudget({
        file: policy.ledgerPath,
        capMicros: policy.capEurMicros,
        amountMicros: reservationMicros,
        now: options.now,
      });
    } catch (error) {
      const reached = error?.code === "local-budget-reached";
      emit({ event: "turn", code: reached ? "local-budget-reached" : "budget-unavailable" });
      sendJson(res, 403, {
        ok: false,
        code: reached ? "local_budget_reached" : "budget_unavailable",
        text: reached ? MESSAGES.local_budget_reached : MESSAGES.budget_unavailable,
        live: false,
        transmitted: false,
        source: "local-policy",
        paidFallback: false,
        accountWideHardEurCap: false,
      });
      return;
    }

    let result;
    try {
      result = await generateTurn({
        fetchImpl,
        apiKey,
        model: policy.model,
        system,
        contents,
        timeoutMs: policy.timeoutMs,
      });
    } catch {
      result = { ok: false, code: "gemini_error", usage: null };
    }
    try {
      await settleBudget({
        file: policy.ledgerPath,
        capMicros: policy.capEurMicros,
        id: reservation.id,
        usage: result.usage ?? null,
        now: options.now,
      });
    } catch {
      emit({ event: "turn", code: "budget-settle-failed" });
    }
    emit({ event: "turn", code: result.code, upstreamStatus: result.upstreamStatus ?? null, role: role.id });

    if (!result.ok) {
      sendJson(res, result.code === "gemini_quota" ? 429 : result.code === "gemini_timeout" ? 504 : 502, {
        ok: false,
        code: result.code,
        text: MESSAGES[result.code] ?? MESSAGES.gemini_error,
        live: false,
        transmitted: true,
        verifiedAccount: false,
        source: "gemini-error",
        model: policy.model,
        paidFallback: false,
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      code: "ok",
      source: "gemini-free-tier",
      live: false,
      transmitted: true,
      verifiedAccount: false,
      role: role.id,
      model: policy.model,
      text: result.text,
      paidFallback: false,
    });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      emit({ event: "error", code: error?.code === "too-large" ? "too_large" : "internal" });
      if (!res.headersSent) {
        sendJson(res, 500, {
          ok: false,
          code: "internal",
          text: MESSAGES.internal,
          live: false,
          transmitted: false,
        });
      }
    });
  });
  server.requestTimeout = 25_000;
  return { server, policy };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const fileEnv = loadEnvFile(path.join(path.dirname(fileURLToPath(import.meta.url)), ".env"));
  const env = { ...fileEnv, ...process.env };
  const { server, policy } = createAzumGeminiServer({ env });
  const port = Number(env.AZUM_PORT || 8787);
  server.listen(port, policy.bind, () => {
    console.log(
      JSON.stringify({
        event: "listen",
        bind: policy.bind,
        port,
        mode: policy.mode,
        live: policy.live,
        reasons: policy.reasons,
      })
    );
  });
}

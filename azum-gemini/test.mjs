import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluatePolicy, publicStatus, FREE_MODEL } from "./policy.js";
import { buildGeminiRequest, classifyUpstream, generateTurn } from "./gemini-client.js";
import { classifyTurn } from "./safety.js";
import { createAzumGeminiServer } from "./server.js";
import { badgeFor, BUDGET_NOTICE, buildTurnBody, isLoopbackHost, panelModel } from "../azum/gemini-bridge.js";
import {
  estimateReservationMicros,
  eurMicrosForTokens,
  periodKey,
  readBudget,
  reserveBudget,
  settleBudget,
  USER_FACING_LIMIT,
} from "./budget.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = "loopback-gate-secret";
const KEY = "test-key-should-not-leak-9f3a";

function freeEnv(overrides = {}) {
  return {
    AZUM_GEMINI_MODE: "free",
    GEMINI_API_KEY: KEY,
    GEMINI_FREE_TIER_CONFIRMED: "yes",
    GEMINI_BILLING_LINKED: "no",
    AZUM_OPERATOR_REGION: "us",
    AZUM_GATE_SECRET: GATE,
    GEMINI_MODEL: FREE_MODEL,
    AZUM_BIND: "127.0.0.1",
    AZUM_MONTHLY_BUDGET_EUR: "30",
    AZUM_BUDGET_LEDGER: path.join(
      os.tmpdir(),
      `azum-budget-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
    ),
    ...overrides,
  };
}

async function listen(options) {
  const logs = [];
  const { server, policy } = createAzumGeminiServer({ ...options, log: (event) => logs.push(event) });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    policy,
    logs,
    port,
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function turn(base, body, gate = GATE) {
  return fetch(`${base}/api/azum/gemini/turn`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${gate}`,
    },
    body: JSON.stringify({ consent: true, role: "core", text: "hola", ...body }),
  });
}

test("closed without credentials and without a confirmed free tier", () => {
  const policy = evaluatePolicy({});
  assert.equal(policy.live, false);
  assert.equal(policy.mode, "closed");
  assert.ok(policy.reasons.includes("mode-closed"));
  const status = publicStatus(policy);
  assert.equal(status.connected, false);
  assert.equal(status.verifiedAccount, false);
  assert.equal(status.paidFallback, false);
  assert.equal(JSON.stringify(status).includes("AIza"), false);
});

test("free path refuses EEA, billing, paid fallback, public bind, and other models", () => {
  assert.ok(evaluatePolicy(freeEnv({ AZUM_OPERATOR_REGION: "es" })).reasons.includes("eea-ch-uk-paid-services-only"));
  assert.ok(evaluatePolicy(freeEnv({ AZUM_OPERATOR_REGION: "uk" })).reasons.includes("eea-ch-uk-paid-services-only"));
  assert.equal(evaluatePolicy(freeEnv({ GEMINI_BILLING_LINKED: "yes" })).live, false);
  assert.equal(evaluatePolicy(freeEnv({ GEMINI_FREE_TIER_CONFIRMED: "no" })).live, false);
  assert.equal(evaluatePolicy(freeEnv({ GEMINI_API_KEY: "" })).live, false);
  assert.ok(evaluatePolicy(freeEnv({ AZUM_ALLOW_PAID: "yes" })).reasons.includes("paid-fallback-forbidden"));
  assert.ok(evaluatePolicy(freeEnv({ AZUM_BIND: "0.0.0.0" })).reasons.includes("public-bind-forbidden"));
  assert.equal(evaluatePolicy(freeEnv({ AZUM_BIND: "0.0.0.0" })).bind, "127.0.0.1");
  assert.ok(evaluatePolicy(freeEnv({ GEMINI_MODEL: "gemini-2.5-pro" })).reasons.includes("model-not-on-free-allowlist"));
  const ready = evaluatePolicy(freeEnv());
  assert.equal(ready.live, true);
  assert.equal(ready.model, FREE_MODEL);
  assert.equal(publicStatus(ready).connected, false);
  assert.equal(publicStatus(ready).callAllowed, true);
});

test("mock mode never requires a key and never marks the account verified", () => {
  const policy = evaluatePolicy({ AZUM_GEMINI_MODE: "mock" });
  assert.equal(policy.mode, "mock");
  assert.equal(policy.live, false);
  assert.equal(publicStatus(policy).verifiedAccount, false);
});

test("Gemini request uses the free model, hides the key from the URL, and sends no tools", () => {
  const request = buildGeminiRequest({
    model: FREE_MODEL,
    system: "sistema",
    contents: [{ role: "user", parts: [{ text: "hola" }] }],
  });
  assert.equal(request.url, `https://generativelanguage.googleapis.com/v1beta/models/${FREE_MODEL}:generateContent`);
  assert.equal(request.url.includes(KEY), false);
  assert.equal(request.init.headers["x-goog-api-key"], undefined);
  const body = JSON.parse(request.init.body);
  assert.equal(body.tools, undefined);
  assert.equal(body.generationConfig.thinkingConfig.thinkingBudget, 0);
  assert.equal(body.generationConfig.maxOutputTokens, 512);
  assert.throws(() => buildGeminiRequest({ model: "gemini-2.5-pro", system: "x", contents: [] }));
});

test("upstream quota and billing errors do not look like a paid retry", () => {
  assert.equal(classifyUpstream(429, "RESOURCE_EXHAUSTED"), "gemini_quota");
  assert.equal(classifyUpstream(403, "billing account required"), "gemini_not_free");
  assert.equal(classifyUpstream(400, "User location is not supported"), "gemini_not_free");
});

test("local safety keeps crisis, medicine, and payments off the wire", () => {
  assert.equal(classifyTurn("quiero morirme"), "crisis");
  assert.equal(classifyTurn("dolor en el pecho"), "urgencia");
  assert.equal(classifyTurn("un comprimido de diazepam"), "medicacion");
  assert.equal(classifyTurn("pásame el PayPal"), "pagos");
  assert.equal(classifyTurn("hola, gracias"), "ninguno");
});

test("browser bundle does not contain a Gemini endpoint or a key", () => {
  const source = fs.readFileSync(path.join(root, "azum/gemini-bridge.js"), "utf8");
  assert.equal(source.includes("googleapis.com"), false);
  assert.equal(source.includes("AIza"), false);
  assert.equal(source.includes(KEY), false);
  assert.equal(isLoopbackHost("osnewspedrosg-glitch.github.io"), false);
  assert.equal(panelModel("osnewspedrosg-glitch.github.io").canSend, false);
  assert.equal(panelModel("127.0.0.1").canSend, true);
  const body = buildTurnBody({ role: "eva", text: "hola", history: [], consent: true });
  assert.equal(body.model, undefined);
  assert.equal(JSON.stringify(body).includes("key"), false);
  assert.match(badgeFor("mock"), /No es Gemini/);
  assert.match(badgeFor("gemini-free-tier"), /no ha verificado/);
});

test("published page keeps the local demo and the disconnected payments copy", () => {
  const html = fs.readFileSync(path.join(root, "azum/index.html"), "utf8");
  assert.match(html, /Motor local/);
  assert.match(html, /sin red/);
  assert.match(html, /Los pagos no están conectados/);
  assert.match(html, /Desactivado y sin configurar/);
  assert.match(html, /gemini-bridge\.js/);
  assert.match(html, /MAY HEALTH/);
  assert.equal(html.includes(KEY), false);
  assert.equal(html.includes("googleapis.com"), false);
});

test("mock turn needs consent and the gate, and does not call Google", async () => {
  let calls = 0;
  const ctx = await listen({
    env: { AZUM_GEMINI_MODE: "mock", AZUM_GATE_SECRET: GATE },
    fetchImpl: async () => {
      calls += 1;
      throw new Error("network");
    },
  });
  try {
    const status = await fetch(`${ctx.base}/api/azum/gemini/status`);
    const statusBody = await status.json();
    assert.equal(statusBody.mode, "mock");
    assert.equal(statusBody.connected, false);
    assert.equal(JSON.stringify(statusBody).includes(GATE), false);

    const denied = await turn(ctx.base, { consent: false });
    assert.equal(denied.status, 400);
    const missingGate = await turn(ctx.base, {}, "");
    assert.equal(missingGate.status, 401);
    const ok = await turn(ctx.base, { role: "isabella", text: "gracias por escucharme" });
    const payload = await ok.json();
    assert.equal(ok.status, 200);
    assert.equal(payload.source, "mock");
    assert.equal(payload.transmitted, false);
    assert.equal(payload.live, false);
    assert.match(payload.text, /no es Gemini/i);
    assert.equal(calls, 0);
    assert.equal(JSON.stringify(ctx.logs).includes(GATE), false);
  } finally {
    await ctx.close();
  }
});

test("crisis and payment turns are not transmitted", async () => {
  let calls = 0;
  const ctx = await listen({
    env: freeEnv(),
    fetchImpl: async () => {
      calls += 1;
      return new Response("no");
    },
  });
  try {
    const crisis = await (await turn(ctx.base, { text: "quiero morirme" })).json();
    assert.equal(crisis.transmitted, false);
    assert.match(crisis.text, /112/);
    const pay = await (await turn(ctx.base, { text: "abre PayPal" })).json();
    assert.match(pay.text, /no están conectados/i);
    assert.equal(calls, 0);
  } finally {
    await ctx.close();
  }
});

test("EEA region and a missing free-tier confirmation never call the model", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response("no");
  };
  const eea = await listen({ env: freeEnv({ AZUM_OPERATOR_REGION: "es" }), fetchImpl });
  const unconfirmed = await listen({ env: freeEnv({ GEMINI_FREE_TIER_CONFIRMED: "no" }), fetchImpl });
  try {
    const eeaResponse = await turn(eea.base, { text: "hola" });
    assert.equal(eeaResponse.status, 403);
    const eeaBody = await eeaResponse.json();
    assert.equal(eeaBody.code, "eea-ch-uk-paid-services-only");
    assert.equal(eeaBody.transmitted, false);
    const closed = await turn(unconfirmed.base, { text: "hola" });
    assert.equal(closed.status, 403);
    assert.equal(calls, 0);
    assert.equal(JSON.stringify(eea.logs).includes(KEY), false);
  } finally {
    await eea.close();
    await unconfirmed.close();
  }
});

test("quota exhaustion is honest and is not retried on another model", async () => {
  const calls = [];
  const ctx = await listen({
    env: freeEnv(),
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED" } }), { status: 429 });
    },
  });
  try {
    const response = await turn(ctx.base, { text: "quiero ordenar la tarde" });
    const payload = await response.json();
    assert.equal(response.status, 429);
    assert.equal(payload.code, "gemini_quota");
    assert.match(payload.text, /cuota gratuita/);
    assert.match(payload.text, /No hay paso automático a un servicio de pago/);
    assert.equal(payload.paidFallback, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.includes(KEY), false);
    assert.equal(calls[0].init.headers["x-goog-api-key"], KEY);
    assert.equal(JSON.stringify(ctx.logs).includes(KEY), false);
  } finally {
    await ctx.close();
  }
});

test("a billing rejection does not fall back to a paid model", async () => {
  const calls = [];
  const ctx = await listen({
    env: freeEnv(),
    fetchImpl: async (url) => {
      calls.push(url);
      return new Response("billing account required", { status: 403 });
    },
  });
  try {
    const payload = await (await turn(ctx.base, { text: "hola de nuevo" })).json();
    assert.equal(payload.code, "gemini_not_free");
    assert.match(payload.text, /No se reintenta/);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /gemini-2\.5-flash/);
  } finally {
    await ctx.close();
  }
});

test("a configured free call returns model text without storing the chat", async () => {
  const ctx = await listen({
    env: freeEnv(),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Una lectura tentativa, no un diagnóstico." }] } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      ),
  });
  try {
    const payload = await (await turn(ctx.base, { role: "isabella", text: "estoy cansado" })).json();
    assert.equal(payload.ok, true);
    assert.equal(payload.source, "gemini-free-tier");
    assert.equal(payload.verifiedAccount, false);
    assert.equal(payload.live, false);
    assert.equal(payload.transmitted, true);
    assert.match(payload.text, /tentativa/);
    assert.equal(payload.chatStored, undefined);
    const leaked = JSON.stringify(ctx.logs);
    assert.equal(leaked.includes(KEY), false);
    assert.equal(leaked.includes("estoy cansado"), false);
  } finally {
    await ctx.close();
  }
});

test("local rate limit stops a second call", async () => {
  let calls = 0;
  const ctx = await listen({
    env: freeEnv({ AZUM_RPM: "1" }),
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "vale" }] } }] }), {
        status: 200,
      });
    },
  });
  try {
    assert.equal((await turn(ctx.base, { text: "primer turno" })).status, 200);
    const limited = await turn(ctx.base, { text: "segundo turno" });
    const payload = await limited.json();
    assert.equal(limited.status, 429);
    assert.equal(payload.code, "bridge_rate_limit");
    assert.match(payload.text, /No se cambia a un plan de pago/);
    assert.equal(calls, 1);
  } finally {
    await ctx.close();
  }
});

test("upstream timeout is reported once", async () => {
  let calls = 0;
  const ctx = await listen({
    env: freeEnv({ AZUM_UPSTREAM_TIMEOUT_MS: "30" }),
    fetchImpl: (_url, init) =>
      new Promise((_resolve, reject) => {
        calls += 1;
        init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
      }),
  });
  try {
    const response = await turn(ctx.base, { text: "hola" });
    const payload = await response.json();
    assert.equal(response.status, 504);
    assert.equal(payload.code, "gemini_timeout");
    assert.equal(calls, 1);
  } finally {
    await ctx.close();
  }
});

test("static Azum is served from loopback and the bridge source is not", async () => {
  const ctx = await listen({ env: { AZUM_GEMINI_MODE: "closed" } });
  try {
    const page = await fetch(`${ctx.base}/osnews/azum/`);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.match(html, /gemini-bridge\.js/);
    assert.match(html, /Leer en local/);
    const secret = await fetch(`${ctx.base}/osnews/azum/../azum-gemini/server.js`);
    assert.notEqual(secret.status, 200);
    const outside = await fetch(`${ctx.base}/azum-gemini/server.js`);
    assert.equal(outside.status, 404);
    const foreign = await fetch(`${ctx.base}/api/azum/gemini/status`, { headers: { origin: "https://example.com" } });
    assert.equal(foreign.status, 403);
  } finally {
    await ctx.close();
  }
});

test("the nominal cap is 30 EUR and cannot be raised, and paid mode stays pending", () => {
  assert.equal(BUDGET_NOTICE, USER_FACING_LIMIT);
  assert.match(USER_FACING_LIMIT, /30,00 EUR/);
  assert.match(USER_FACING_LIMIT, /No es un tope de la factura de Google/);
  const ready = evaluatePolicy(freeEnv());
  assert.equal(ready.live, true);
  assert.equal(ready.paidMode, "disabled");
  assert.equal(ready.accountWideHardEurCap, false);
  assert.equal(publicStatus(ready).budget.guaranteesInvoice, false);
  assert.equal(publicStatus(ready).budget.includesHosting, false);
  assert.equal(evaluatePolicy(freeEnv({ AZUM_MONTHLY_BUDGET_EUR: "30.01" })).live, false);
  assert.ok(evaluatePolicy(freeEnv({ AZUM_MONTHLY_BUDGET_EUR: "31" })).reasons.includes("budget-above-nominal-30"));
  assert.equal(evaluatePolicy(freeEnv({ AZUM_MONTHLY_BUDGET_EUR: "10" })).live, true);
  assert.equal(evaluatePolicy(freeEnv({ AZUM_BUDGET_LEDGER: "" })).live, false);
  const paid = evaluatePolicy(freeEnv({ AZUM_GEMINI_MODE: "paid", AZUM_PAID_SETUP_APPROVED: "yes", AZUM_SPEND_CONTROLS_CONFIRMED: "yes" }));
  assert.equal(paid.live, false);
  assert.equal(paid.paidActivation, "pending");
  assert.ok(paid.reasons.includes("paid-activation-pending"));
  assert.equal(evaluatePolicy(freeEnv({ AZUM_PAID_MODE: "yes" })).live, false);
});

test("token cost rounds up and includes thinking at the output price", () => {
  assert.equal(eurMicrosForTokens({ inputTokens: 1_000_000, outputTokens: 0, thinkingTokens: 0 }), 363_000n);
  assert.equal(
    eurMicrosForTokens({ inputTokens: 0, outputTokens: 512, thinkingTokens: 1024 }),
    eurMicrosForTokens({ inputTokens: 0, outputTokens: 1536, thinkingTokens: 0 })
  );
  const estimate = estimateReservationMicros({
    system: "a".repeat(10),
    contents: [{ parts: [{ text: "hola" }] }],
  });
  assert.ok(estimate > 0n);
  assert.ok(estimate < 30_000_000n);
});

test("parallel reservations cannot pass the cap, and a failed call keeps the hold", async () => {
  const file = path.join(os.tmpdir(), `azum-budget-race-${Date.now()}.json`);
  const cap = 5_000_000n;
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      reserveBudget({ file, capMicros: cap, amountMicros: 1_000_000n }).then(
        (value) => value,
        (error) => error
      )
    )
  );
  const ok = results.filter((item) => item?.id);
  const denied = results.filter((item) => item?.code === "local-budget-reached");
  assert.equal(ok.length, 5);
  assert.equal(denied.length, 3);
  await settleBudget({ file, capMicros: cap, id: ok[0].id, usage: null });
  const after = await readBudget(file, cap);
  assert.equal(after.countedEurMicros, "5000000");
  await assert.rejects(
    reserveBudget({ file, capMicros: cap, amountMicros: 1n }),
    (error) => error.code === "local-budget-reached"
  );
});

test("known usage can settle below the reservation, and the next month starts clear", async () => {
  const file = path.join(os.tmpdir(), `azum-budget-month-${Date.now()}.json`);
  let current = new Date("2026-11-07T12:00:00Z");
  const now = () => current;
  const cap = 30_000_000n;
  const held = await reserveBudget({ file, capMicros: cap, amountMicros: 10_000n, now });
  await settleBudget({
    file,
    capMicros: cap,
    id: held.id,
    usage: { inputTokens: 1000, outputTokens: 10, thinkingTokens: 0 },
    now,
  });
  const november = await readBudget(file, cap, now);
  assert.ok(BigInt(november.countedEurMicros) < 10_000n);
  assert.ok(BigInt(november.countedEurMicros) > 0n);
  current = new Date("2026-12-07T12:00:00Z");
  const december = await readBudget(file, cap, now);
  assert.equal(december.period, periodKey(current));
  assert.equal(december.countedEurMicros, "0");
});

test("a full or corrupt ledger blocks the upstream call", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response("no");
  };
  const fullEnv = freeEnv();
  fs.mkdirSync(path.dirname(fullEnv.AZUM_BUDGET_LEDGER), { recursive: true });
  fs.writeFileSync(
    fullEnv.AZUM_BUDGET_LEDGER,
    JSON.stringify({
      version: 1,
      period: periodKey(new Date()),
      timezone: "Europe/Madrid",
      history: [],
      entries: [
        {
          id: "full",
          at: new Date().toISOString(),
          reservedEurMicros: "30000000",
          state: "kept",
          settledEurMicros: "30000000",
        },
      ],
    })
  );
  const corruptEnv = freeEnv();
  fs.mkdirSync(path.dirname(corruptEnv.AZUM_BUDGET_LEDGER), { recursive: true });
  fs.writeFileSync(corruptEnv.AZUM_BUDGET_LEDGER, "{");
  const full = await listen({ env: fullEnv, fetchImpl });
  const corrupt = await listen({ env: corruptEnv, fetchImpl });
  try {
    const fullBody = await (await turn(full.base, { text: "hola" })).json();
    assert.equal(fullBody.code, "local_budget_reached");
    assert.match(fullBody.text, /no frena la factura de Google/);
    assert.equal(fullBody.accountWideHardEurCap, false);
    const corruptBody = await (await turn(corrupt.base, { text: "hola" })).json();
    assert.equal(corruptBody.code, "budget_unavailable");
    assert.equal(calls, 0);
    const status = await (await fetch(`${full.base}/api/azum/gemini/status`)).json();
    assert.equal(status.budget.guaranteesInvoice, false);
    assert.equal(status.budget.countedEurMicros, "30000000");
    assert.equal(status.paidMode, "disabled");
    assert.equal(JSON.stringify(status).includes(KEY), false);
  } finally {
    await full.close();
    await corrupt.close();
  }
});

test("a successful mock of usage settles the ledger and does not call a second model", async () => {
  const env = freeEnv();
  const calls = [];
  const ctx = await listen({
    env,
    fetchImpl: async (url) => {
      calls.push(url);
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "vale" }] } }],
          usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 5, thoughtsTokenCount: 0 },
        }),
        { status: 200 }
      );
    },
  });
  try {
    const payload = await (await turn(ctx.base, { text: "hola" })).json();
    assert.equal(payload.ok, true);
    assert.equal(calls.length, 1);
    const snap = await readBudget(env.AZUM_BUDGET_LEDGER, 30_000_000n);
    assert.ok(BigInt(snap.countedEurMicros) > 0n);
    assert.ok(BigInt(snap.countedEurMicros) < estimateReservationMicros({ system: "x", contents: [] }));
  } finally {
    await ctx.close();
  }
});

test("generateTurn does not put the key in a thrown log string", async () => {
  const result = await generateTurn({
    apiKey: KEY,
    model: FREE_MODEL,
    system: "sistema",
    contents: [{ role: "user", parts: [{ text: "hola" }] }],
    timeoutMs: 1000,
    fetchImpl: async () => new Response("upstream " + KEY, { status: 500 }),
  });
  assert.equal(result.code, "gemini_error");
  assert.equal(JSON.stringify(result).includes(KEY), false);
});

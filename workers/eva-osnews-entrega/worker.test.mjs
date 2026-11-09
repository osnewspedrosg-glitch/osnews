import test from "node:test";
import assert from "node:assert/strict";
import { handle, validate, ALLOWED_ORIGIN, MAX_BYTES } from "./worker.js";

const good = {
  id: "eva-abc123-xyz",
  title: "PRUEBA FICTICIA corte de agua",
  country: "España",
  factDate: "2026-11-08",
  description: "PRUEBA FICTICIA. Texto de ejemplo sin datos personales.",
  urls: ["https://example.org/aviso"],
  kind: "hecho",
  status: "recibida",
};
const env = { EVA_WEBHOOK_URL: "https://hook.example/run", EVA_WEBHOOK_KEY: "k-secret" };
const req = (body, { origin = ALLOWED_ORIGIN, method = "POST", type = "application/json", path = "/expediente" } = {}) =>
  new Request(`https://w.example${path}`, {
    method, headers: { Origin: origin, "Content-Type": type },
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });

test("valid dossier is forwarded with Bearer key and the key never reaches the reply", async () => {
  let seen;
  const fake = async (url, init) => { seen = { url, init }; return new Response("ok", { status: 200 }); };
  const res = await handle(req(good), env, fake);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), ALLOWED_ORIGIN);
  const text = await res.text();
  assert.doesNotMatch(text, /k-secret|hook\.example/);
  assert.equal(seen.url, env.EVA_WEBHOOK_URL);
  assert.equal(seen.init.headers.Authorization, "Bearer k-secret");
  const sent = JSON.parse(seen.init.body);
  assert.equal(sent.expediente.id, good.id);
  assert.equal(sent.expediente.urls[0], "https://example.org/aviso");
});

test("other origins, methods and content types are refused", async () => {
  const never = async () => { throw new Error("should not forward"); };
  assert.equal((await handle(req(good, { origin: "https://evil.example" }), env, never)).status, 403);
  assert.equal((await handle(req(good, { type: "text/plain" }), env, never)).status, 415);
  assert.equal((await handle(req(null, { method: "GET" }), env, never)).status, 405);
  const pre = await handle(req(null, { method: "OPTIONS" }), env, never);
  assert.equal(pre.status, 204);
  assert.equal((await handle(req(null, { method: "OPTIONS", origin: "https://evil.example" }), env, never)).status, 403);
});

test("oversized, broken and invalid bodies are refused", async () => {
  const never = async () => { throw new Error("should not forward"); };
  const big = { ...good, description: "x".repeat(MAX_BYTES + 10) };
  assert.equal((await handle(req(big), env, never)).status, 413);
  assert.equal((await handle(req("{nope"), env, never)).status, 400);
  assert.equal((await handle(req({ ...good, urls: ["javascript:alert(1)"] }), env, never)).status, 422);
  assert.equal((await handle(req({ ...good, id: "../x" }), env, never)).status, 422);
  assert.equal(validate({ ...good, factDate: "8/11/2026" }).ok, false);
  assert.equal(validate({ ...good, urls: [] }).ok, false);
  assert.equal(validate(good).ok, true);
});

test("missing secrets give a controlled 503", async () => {
  const res = await handle(req(good), {}, async () => { throw new Error("no"); });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /no está configurada/);
});

test("webhook failure and rate limit are reported honestly", async () => {
  const fail = await handle(req(good), env, async () => new Response("", { status: 401 }));
  assert.equal(fail.status, 502);
  assert.match((await fail.json()).error, /401/);
  const down = await handle(req(good), env, async () => { throw new Error("net"); });
  assert.equal(down.status, 502);
  const limited = { ...env, RL_CLIENT: { limit: async () => ({ success: false }) } };
  assert.equal((await handle(req(good), limited, async () => new Response("", { status: 200 }))).status, 429);
});

test("health check says whether it is configured without leaking secrets", async () => {
  const res = await handle(new Request("https://w.example/"), env);
  const body = await res.json();
  assert.equal(body.configurado, true);
  assert.doesNotMatch(JSON.stringify(body), /k-secret|hook/);
});

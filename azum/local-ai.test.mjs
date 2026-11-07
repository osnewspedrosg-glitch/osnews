import test from "node:test";
import assert from "node:assert/strict";
import { SYSTEM_PROMPT } from "./local-ai-engine.js";
import {
  CACHE_NAME,
  GGUF_BYTES,
  LICENSE,
  MODEL_FILES,
  WASM_BUNDLE_BYTES,
  WASM_MODEL_BYTES,
  assessDevice,
  downloadModel,
  formatBytes,
  ggufUrl,
  identityReply,
  labelFor,
  panelState,
  probeWebGpu,
  removeOwnModel,
  requirementsText,
  runLocalTurn,
  statusText,
} from "./local-ai.js";

test("the published plan names the Apache model and the measured file sizes", () => {
  assert.equal(WASM_BUNDLE_BYTES, 523_587_267);
  assert.equal(WASM_MODEL_BYTES, 512_096_636);
  assert.equal(GGUF_BYTES, 491_400_032);
  assert.equal(LICENSE, "Apache-2.0");
  const text = requirementsText();
  assert.match(text, /523\.587\.267/);
  assert.match(text, /491\.400\.032/);
  assert.match(text, /Apache-2\.0/);
  assert.match(text, /no medida/);
  assert.match(text, /6 GB virtuales/);
  assert.match(text, /No borres nada/);
  assert.match(text, /no empieza sola/);
  assert.equal(formatBytes(WASM_BUNDLE_BYTES), "523.587.267");
  assert.equal(MODEL_FILES.length, 10);
  assert.match(ggufUrl(), /qwen2\.5-0\.5b-instruct-q4_k_m\.gguf/);
});

test("the shipped panel keeps rules, Gemini and payments apart until consent", () => {
  const state = panelState({ webAssembly: true, webgpu: "adapter", deviceMemoryGb: 8 });
  assert.match(state.rulesLabel, /No es IA/);
  assert.equal(state.downloadEnabled, false);
  assert.equal(state.generateEnabled, false);
  assert.equal(state.geminiEnabled, false);
  assert.equal(state.paymentsEnabled, false);
  assert.equal(state.assessment.runtimeConnected, true);
  const consented = panelState({ webAssembly: true, consent: true });
  assert.equal(consented.downloadEnabled, true);
  assert.equal(panelState({ webAssembly: false, consent: true }).downloadEnabled, false);
  assert.equal(labelFor("device").includes("IA local"), true);
  assert.equal(labelFor("mock").includes("Simulación"), true);
  assert.notEqual(labelFor("device"), labelFor("rules"));
  assert.equal(state.assessment.tabletTested, false);
  assert.equal(state.assessment.npuUsed, false);
  assert.equal(state.assessment.speedKnown, false);
  assert.equal(state.assessment.virtualRamCounted, false);
  assert.equal(state.assessment.deviceMemoryIsPhysical, false);
  assert.match(state.status, /Todavía no hay una respuesta/);
});

test("missing WebAssembly is unsupported and 8 GB reported by the browser is not physical RAM", () => {
  const missing = assessDevice({ webAssembly: false, deviceMemoryGb: 8 });
  assert.equal(missing.guidance, "unsupported-no-wasm");
  assert.match(statusText(missing.guidance), /No hay modelo/);
  const reported = assessDevice({ webAssembly: true, deviceMemoryGb: 8, webgpu: "unknown" });
  assert.equal(reported.deviceMemoryGb, 8);
  assert.equal(reported.deviceMemoryIsPhysical, false);
  assert.equal(reported.guidance, "wasm-ready");
});

test("WebGPU probe does not invent an adapter", async () => {
  assert.equal(await probeWebGpu(undefined), "absent");
  assert.equal(await probeWebGpu({ requestAdapter: async () => null }), "no-adapter");
  assert.equal(await probeWebGpu({ requestAdapter: async () => ({}) }), "adapter");
  assert.equal(await probeWebGpu({ requestAdapter: async () => { throw new Error("blocked"); } }), "no-adapter");
});

test("download waits for consent and then fetches the model", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true };
  };
  const denied = await downloadModel({ fetchImpl, consent: false, cachePut: async () => {} });
  assert.equal(denied.code, "consent-required");
  assert.equal(calls, 0);
  const allowed = await downloadModel({
    fetchImpl,
    consent: true,
    files: MODEL_FILES.slice(0, 1),
    cachePut: async () => {},
  });
  assert.equal(allowed.ok, true);
  assert.equal(calls, 1);
});

test("a consented mock download reports progress, and cancel removes only its cache", async () => {
  const stored = [];
  const progress = [];
  const controller = new AbortController();
  let fetched = 0;
  const files = MODEL_FILES.slice(0, 3);
  const result = await downloadModel({
    consent: true,
    runtimeConnected: true,
    files,
    signal: controller.signal,
    fetchImpl: async (url) => {
      fetched += 1;
      if (fetched === 2) controller.abort();
      return { ok: true, url };
    },
    cachePut: async (url) => stored.push(url),
    onProgress: (event) => progress.push(event.loaded),
    removePartial: async () => stored.splice(0, stored.length),
  });
  assert.equal(result.code, "cancelled");
  assert.equal(stored.length, 0);
  assert.ok(progress.length >= 1);
  assert.equal(fetched, 2);
});

test("a foreign URL is refused", async () => {
  const result = await downloadModel({
    consent: true,
    runtimeConnected: true,
    files: [{ path: "x", bytes: 1, url: "https://example.com/model.bin" }],
    fetchImpl: async () => ({ ok: true }),
    cachePut: async () => {},
  });
  assert.equal(result.code, "url-not-allowed");
});

test("removal deletes only the model cache name", async () => {
  const deleted = [];
  const outcome = await removeOwnModel({
    delete: async (name) => {
      deleted.push(name);
      return name === CACHE_NAME;
    },
  });
  assert.deepEqual(deleted, [CACHE_NAME]);
  assert.equal(outcome.deleted, true);
  assert.equal(outcome.cacheName, CACHE_NAME);
});

test("failed or empty generation never fabricates an answer", async () => {
  const missing = await runLocalTurn({ engine: null, text: "hola", runtimeConsent: true });
  assert.equal(missing.text, null);
  assert.equal(missing.source, "none");
  const crashed = await runLocalTurn({
    engine: { generate: async () => { throw new Error("oom"); } },
    text: "hola",
    runtimeConsent: true,
  });
  assert.equal(crashed.code, "engine-failed");
  assert.equal(crashed.text, null);
  const empty = await runLocalTurn({
    engine: { generate: async () => ({ text: "   " }) },
    text: "hola",
    runtimeConsent: true,
  });
  assert.equal(empty.code, "empty-generation");
  assert.equal(empty.text, null);
});

test("the system line is a persona, not the instruction the tablet quoted", () => {
  assert.equal(SYSTEM_PROMPT, "Eres Azum, la IA de esta página.");
  assert.doesNotMatch(SYSTEM_PROMPT, /di cuál es|dos opciones|Responde en español|Me llamo Ana/);
});

test("name and human questions use a labeled app rule, other questions do not", () => {
  const ruled = identityReply("Hola como te llamas");
  assert.equal(ruled, identityReply("¿Eres humano?"));
  assert.match(ruled, /Soy Azum/);
  assert.match(ruled, /No soy una persona/);
  assert.equal(identityReply("¿Eres Grok?"), ruled);
  assert.equal(identityReply("¿De qué color es el cielo cuando está despejado?"), null);
  assert.equal(identityReply("Por la mañana, ¿se dice buenos días o buenas noches?"), null);
  assert.equal(identityReply("Me llamo pedro"), null);
  assert.equal(identityReply("¿Cómo me llamo?"), null);
  assert.notEqual(labelFor("app-rule"), labelFor("device"));
  assert.match(labelFor("app-rule"), /No es texto nuevo del modelo/);
});

test("a mock engine is labeled as a mock and is not a device result", async () => {
  const result = await runLocalTurn({
    engine: { generate: async () => ({ mock: true, text: "simulacion" }) },
    text: "hola",
    runtimeConsent: true,
  });
  assert.equal(result.source, "mock");
  assert.equal(result.text, "simulacion");
  assert.notEqual(result.source, "device");
});

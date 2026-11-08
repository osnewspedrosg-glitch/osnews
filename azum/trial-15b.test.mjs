import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { TRIAL_15B, classifySavedModel, consentText, prepareTrialIsolation, stageText, trialLoadOptions, trialSampling, withTimeout } from "./trial-15b.js";

const read = (name) => fs.readFileSync(new URL(name, import.meta.url), "utf8");

test("the 1.5B trial does not replace the installed 0.5B model", async () => {
  const engine = read("./local-ai-engine.js");
  const index = read("./index.html");
  const worker = read("./coi-serviceworker.js");
  const page = read("./trial-15b.html");
  assert.match(engine, /onnx-community\/Qwen2\.5-0\.5B-Instruct/);
  assert.match(engine, /azum-local-ai-qwen2\.5-0\.5b-uint8/);
  assert.equal(engine.includes("Qwen2.5-1.5B-Instruct-GGUF"), false);
  assert.equal(index.includes("trial-15b"), false);
  assert.equal(TRIAL_15B.separateFromCache, "azum-local-ai-qwen2.5-0.5b-uint8");
  assert.equal(TRIAL_15B.modelBytes, 1_117_320_736);
  assert.equal(TRIAL_15B.wasmBytes, 8_763_949);
  assert.equal(TRIAL_15B.moduleBytes, 382_633);
  assert.equal(trialLoadOptions().n_gpu_layers, 0);
  assert.equal(trialLoadOptions().n_threads, 1);
  assert.equal(trialLoadOptions().useCache, true);
  assert.match(stageText("motor"), /no es la descarga/);
  assert.match(stageText("incompleto", { bytes: 10 }), /No la borro y no vuelvo a descargar/);
  assert.equal(stageText("guardado").includes("Descargando"), false);
  assert.equal(trialSampling().temperature, 0);
  assert.match(consentText(), /1\.117\.320\.736/);
  assert.match(consentText(), /8\.763\.949/);
  assert.match(consentText(), /No sustituye el modelo de 0,5B/);
  assert.match(consentText(), /2,9 GiB/);
  assert.match(page, /consent\.checked/);
  assert.match(page, /Cancelar la descarga/);
  assert.match(page, /Cargar el modelo de 1,5B/);
  assert.match(page, /Aprobar otra descarga del modelo/);
  assert.equal(page.includes("cacheManager.clear"), false);
  assert.equal(read("./trial-15b.js").includes("cacheManager.clear"), false);
  assert.equal(read("./trial-15b.js").includes(".remove("), false);
  const name = "qwen2.5-1.5b-instruct-q4_k_m.gguf";
  assert.equal(classifySavedModel([{ name: `abc_${name}`, size: TRIAL_15B.modelBytes, metadata: { originalSize: TRIAL_15B.modelBytes, originalURL: "" } }]).state, "complete");
  assert.equal(classifySavedModel([{ name: `abc_${name}`, size: 100, metadata: { originalSize: 100, originalURL: TRIAL_15B.modelUrl } }]).state, "incomplete");
  assert.equal(classifySavedModel([]).state, "absent");
  await assert.rejects(withTimeout(new Promise(() => {}), 15, "motor-timeout"), { code: "motor-timeout" });
  assert.equal(page.includes("URLSearchParams"), false);
  assert.equal(page.includes("caches.delete"), false);
  assert.equal(page.includes("Soy Azum, la IA local"), false);
  assert.match(worker, /Cross-Origin-Resource-Policy/);
  assert.equal(worker.includes("model_uint8"), false);
  assert.equal(worker.includes(".gguf"), false);
  const isolated = await prepareTrialIsolation({
    navigator: {},
    crossOriginIsolated: false,
    sessionStorage: { getItem: () => null, setItem: () => {} },
    location: { reload: () => { throw new Error("should not reload"); } },
  });
  assert.equal(isolated, "unavailable");
});

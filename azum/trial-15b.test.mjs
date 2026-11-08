import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { TRIAL_15B, consentText, trialLoadOptions, trialSampling } from "./trial-15b.js";

const read = (name) => fs.readFileSync(new URL(name, import.meta.url), "utf8");

test("the 1.5B trial does not replace the installed 0.5B model", () => {
  const engine = read("./local-ai-engine.js");
  const index = read("./index.html");
  assert.match(engine, /onnx-community\/Qwen2\.5-0\.5B-Instruct/);
  assert.match(engine, /azum-local-ai-qwen2\.5-0\.5b-uint8/);
  assert.equal(engine.includes("Qwen2.5-1.5B-Instruct-GGUF"), false);
  assert.equal(index.includes("trial-15b"), false);
  assert.equal(TRIAL_15B.separateFromCache, "azum-local-ai-qwen2.5-0.5b-uint8");
  assert.equal(TRIAL_15B.modelBytes, 1_117_320_736);
  assert.equal(trialLoadOptions().n_gpu_layers, 0);
  assert.equal(trialLoadOptions().useCache, false);
  assert.equal(trialSampling().temperature, 0);
  assert.match(consentText(), /1\.117\.320\.736/);
  assert.match(consentText(), /No sustituye el modelo de 0,5B/);
  const page = read("./trial-15b.html");
  assert.match(page, /consent\.checked/);
  assert.equal(page.includes("caches.delete"), false);
  assert.equal(page.includes("Soy Azum, la IA local"), false);
});

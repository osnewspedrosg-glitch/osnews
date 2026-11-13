import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ROLES } from "../azum-gemini/roles.js";
import {
  GUIDED_LABEL,
  GUIDED_ROLES,
  STORAGE_KEY,
  emptyMemory,
  deliver,
  forgetGuidedMemory,
  loadMemory,
  respond,
  roleIds,
  saveMemory,
  chooseRole,
  dispatch,
  loadDecisions,
  clearDecisions,
  DECISION_KEY,
} from "./guided-chat.js";

function memoryStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    keys: () => [...data.keys()],
  };
}

test("the guided label is explicit and the thirteen roles stay available", () => {
  assert.equal(GUIDED_LABEL, "Conversación guiada · respuestas programadas, no IA generativa");
  assert.deepEqual(roleIds(), ROLES.map((role) => role.id));
  assert.deepEqual(GUIDED_ROLES.map((role) => role.status), ROLES.map((role) => role.status));
  assert.equal(ROLES.length, 13);
  const page = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
  for (const label of ["Conversar", "Comparar", "Rueda", "Papeles", "Pagos", "Fuentes", "Pruebas", "Leer en local"]) {
    assert.equal(page.includes(label), true, label);
  }
  assert.match(page, /guided-chat-ui\.js/);
  assert.match(page, /local-ai\.js/);
  assert.match(page, /ime-commit\.js/);
  const ui = fs.readFileSync(new URL("./guided-chat-ui.js", import.meta.url), "utf8");
  assert.match(ui, /isComposingEvent/);
  assert.match(ui, /committedValue/);
  assert.match(ui, /keyCode === 229/);
  assert.match(ui, /input\.blur/);
  assert.equal(fs.readFileSync(new URL("../index.html", import.meta.url), "utf8").includes("guided-chat"), false);
});

test("a name survives reload and can be corrected", () => {
  const storage = memoryStore({ "osnews_may_memoria": "ajena", "azum-local-note": "sigue" });
  let memory = emptyMemory();
  let result = respond("me llamo pedro", memory, "core");
  saveMemory(storage, result.memory);
  memory = loadMemory(storage);
  result = respond("cómo me llamo", memory, "core");
  assert.match(result.text, /Pedro/);
  result = respond("no, me llamo Lucía", result.memory, "isabella");
  assert.match(result.text, /Lucía/);
  saveMemory(storage, result.memory);
  assert.match(loadMemory(storage).name, /Lucía/);
  forgetGuidedMemory(storage);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem("osnews_may_memoria"), "ajena");
  assert.equal(storage.getItem("azum-local-note"), "sigue");
});

test("origin, loneliness and an unknown question stay honest", () => {
  let memory = emptyMemory();
  let result = respond("soy de Cartagena", memory, "core");
  assert.match(result.text, /Cartagena/);
  assert.match(result.text, /Qué sitio tan bonito/);
  result = respond("me siento solo", result.memory, "core");
  assert.equal(result.memory.feeling, "soledad");
  assert.match(result.text, /programada/);
  assert.doesNotMatch(result.text, /¿De dónde eres/);
  result = respond("qué tiempo hace en Marte", result.memory, "core");
  assert.match(result.text, /No tengo una respuesta programada/);
  assert.doesNotMatch(result.text, /grados|llueve|Cartagena es/);
  result = respond("de dónde soy", result.memory, "eva");
  assert.match(result.text, /Cartagena/);
});

test("hola is a visible greeting and a storage failure stays visible", () => {
  const hello = respond("hola", emptyMemory(), "core");
  assert.match(hello.text, /^Hola\./);
  assert.equal(hello.text.includes("No tengo una respuesta programada"), false);
  const storage = memoryStore();
  storage.setItem = () => { throw new Error("quota"); };
  const failed = deliver("hola", emptyMemory(), "core", storage);
  assert.match(failed.text, /^Hola\./);
  assert.equal(failed.stored, false);
  assert.match(failed.error, /quota/);
});

test("payments stay disconnected and a repeated prompt is not asked again", () => {
  let result = respond("hola", emptyMemory(), "athena");
  assert.match(result.text, /¿Cómo te llamas/);
  result = respond("qué es un quark", result.memory, "athena");
  assert.match(result.text, /No tengo una respuesta programada/);
  assert.doesNotMatch(result.text, /¿Cómo te llamas/);
  result = respond("cuál es mi saldo de PayPal", result.memory, "athena");
  assert.match(result.text, /No conectado/);
  assert.doesNotMatch(result.text, /\d+\s*€|saldo es/);
});

function fakeLorena({ emotion = "tristeza", intensity = 7, trend = "estable", valence = -1 } = {}) {
  const calls = { analyze: 0, memory: 0, respond: 0, order: [] };
  return {
    calls,
    analyze() {
      calls.analyze += 1;
      calls.order.push("analyze");
      return { emotion, intensity, trend, valence, label: emotion, detected: true };
    },
    memory() {
      calls.memory += 1;
      calls.order.push("memory");
      return { user: { last: null, turns: 0 }, assistant: { replies: 0 } };
    },
    respond(_text, base, opts) {
      calls.respond += 1;
      calls.order.push("respond");
      return { text: `ANOTADA ${base}`, tone: "validacion", mode: opts && opts.mode };
    },
    decideMode(analysis) {
      calls.decideMode = (calls.decideMode || 0) + 1;
      const mode = analysis && analysis.machista && analysis.machista.detected
        ? "lorena"
        : (analysis && /^(tristeza|soledad|miedo)$/.test(analysis.emotion) ? "eva" : "lorena");
      return { mode, modeLabel: mode === "eva" ? "modo Eva" : "modo Lorena", reasons: ["test"] };
    },
  };
}

test("Lorena alimenta la decisión de Azum y solo hay una respuesta", () => {
  const storage = memoryStore();
  const lorena = fakeLorena();
  const result = dispatch("Me llamo Ana y estoy muy triste", emptyMemory(), "core", storage, lorena);
  assert.equal(lorena.calls.analyze, 1, "Lorena analiza antes de decidir");
  assert.ok(lorena.calls.order.indexOf("analyze") < lorena.calls.order.indexOf("respond"));
  assert.equal(result.requestedRole, "core");
  assert.equal(result.chosenRole, "eva", "con tristeza intensa Azum elige EVA");
  assert.equal(result.analysis.emotion, "tristeza");
  assert.equal(result.analysis.intensity, 7);
  assert.equal(typeof result.text, "string");
  assert.equal(Array.isArray(result.text), false);
  assert.match(result.text, /^ANOTADA /);
  assert.match(result.text, /Encantada, Ana|Soy Azum|dices que estás triste/);
  assert.equal((result.text.match(/^ANOTADA /gm) || []).length, 1, "Lorena no añade una segunda respuesta");
  assert.equal(roleIds().length, 13);
});

test("un papel elegido a propósito se respeta y Lorena solo adapta el tono", () => {
  const lorena = fakeLorena({ emotion: "tristeza", intensity: 8 });
  const result = dispatch("estoy triste", emptyMemory(), "isabella", memoryStore(), lorena);
  assert.equal(result.chosenRole, "isabella");
  assert.equal(chooseRole("health", { emotion: "tristeza", intensity: 9, valence: -1 }), "health");
  assert.equal(chooseRole("core", { emotion: "alegria", intensity: 7, valence: 1 }), "core");
  assert.equal(chooseRole("core", { emotion: "ansiedad", intensity: 6, valence: -1 }), "eva");
  assert.match(result.text, /^ANOTADA /);
});

test("sin Lorena, Azum sigue dando una sola respuesta programada", () => {
  const result = dispatch("hola", emptyMemory(), "core", memoryStore(), null);
  assert.equal(result.chosenRole, "core");
  assert.equal(result.analysis, null);
  assert.match(result.text, /Soy Azum/);
  assert.doesNotMatch(result.text, /ANOTADA/);
});


test("el despacho anota el modo y el registro de decisión, un envío y una respuesta", () => {
  const storage = memoryStore();
  const lorena = fakeLorena({ emotion: "tristeza", intensity: 7 });
  const result = dispatch("Me siento muy triste", emptyMemory(), "core", storage, lorena);
  assert.equal(result.mode, "eva");
  assert.equal(result.modeLabel, "modo Eva");
  assert.ok(Array.isArray(result.candidates) && result.candidates.length >= 2);
  assert.equal(result.candidates.filter((c) => c.roleId === result.chosenRole).length, 1);
  const log = loadDecisions(storage);
  assert.equal(log.length, 1);
  assert.equal(log[0].mode, "eva");
  assert.equal(log[0].picked, result.chosenRole);
  assert.equal(log[0].machista, false);
  assert.ok(storage.getItem(DECISION_KEY));
  clearDecisions(storage);
  assert.deepEqual(loadDecisions(storage), []);
});

test("una actitud machista queda en el registro y Azum elige modo Lorena", () => {
  const storage = memoryStore();
  const lorena = fakeLorena({ emotion: "enfado", intensity: 4 });
  const orig = lorena.analyze;
  lorena.analyze = function () {
    const a = orig();
    a.machista = { detected: true, violence: false };
    return a;
  };
  const result = dispatch("Las mujeres no saben conducir", emptyMemory(), "core", storage, lorena);
  assert.equal(result.mode, "lorena");
  assert.equal(loadDecisions(storage)[0].machista, true);
  assert.equal(result.chosenRole, "core");
});

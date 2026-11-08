import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ROLES } from "../azum-gemini/roles.js";
import {
  GUIDED_LABEL,
  GUIDED_ROLES,
  STORAGE_KEY,
  emptyMemory,
  forgetGuidedMemory,
  loadMemory,
  respond,
  roleIds,
  saveMemory,
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

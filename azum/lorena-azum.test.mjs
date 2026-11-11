import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { deliver, emptyMemory } from "./guided-chat.js";

const L = createRequire(import.meta.url)("./lorena.js");
function store() {
  const d = new Map();
  return { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, String(v)), removeItem: (k) => d.delete(k), key: (i) => [...d.keys()][i], get length() { return d.size; } };
}

test("Azum combina su respuesta programada con el Módulo Lorena", () => {
  const s = store();
  const lorena = L.create({ app: "azum", assistant: "Azum", storage: s });
  const base = deliver("estoy triste", emptyMemory(), "core", s);
  const out = lorena.respond("estoy triste", base.text, { lang: "es" });
  assert.ok(out.text.endsWith(base.text));
  assert.equal(out.analysis.emotion, "tristeza");
  assert.ok(s.getItem("lorena-azum-usuario-v1"));
  assert.ok(s.getItem("lorena-azum-asistente-v1"));
  assert.ok(s.getItem("azum-guided-memory-v1"), "la memoria guiada sigue intacta");
});

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { evaBaseReply, evaLorenaReply } from "./lorena-eva.js";

const L = createRequire(import.meta.url)("./lorena.js");
function store() {
  const d = new Map();
  return { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, String(v)), removeItem: (k) => d.delete(k) };
}

test("Eva responde con inteligencia emocional a una denuncia angustiosa", () => {
  const lorena = L.create({ app: "eva", assistant: "Eva", storage: store() });
  const entry = { title: "Corte de agua", description: "Estamos muy preocupados y con miedo, llevamos tres días sin agua." };
  const r = evaLorenaReply(lorena, entry);
  assert.ok(r.text.endsWith(evaBaseReply(entry)));
  assert.ok(["miedo", "ansiedad"].includes(r.analysis.emotion));
  assert.match(r.text, /calma|respir[ao]|serenidad|válido|despacio/i);
  assert.equal(lorena.memory().user.turns, 1);
});

test("sin módulo cargado, Eva da la respuesta de siempre", () => {
  assert.equal(evaLorenaReply(null, { title: "X" }).text, evaBaseReply({ title: "X" }));
});

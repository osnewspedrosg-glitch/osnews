import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { answer, isBookQuestion, NOT_FOUND, GROK_URL, sentences, EXAMPLES } from "./libros-qa.js";

const index = JSON.parse(fs.readFileSync(new URL("./libros-index.json", import.meta.url), "utf8"));
const norm = (s) => s.replace(/\s+/g, " ").trim();
const corpus = index.p.map((row) => norm(row[2]));

function assertLiteral(result) {
  for (const item of result.items) {
    const q = norm(item.quote.replace(/ \[…\]$/, ""));
    assert.ok(corpus.some((t) => t.includes(q)), "cita literal: " + q.slice(0, 80));
  }
}

test("el índice tiene los 13 libros, crédito y nada privado", () => {
  assert.equal(index.books.length, 12);
  assert.equal(index.books.some((b) => /ave-cesar/.test(b.id)), false);
  assert.equal(index.credits, "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok");
  const raw = JSON.stringify(index);
  assert.equal(/Ave César, Ave Sánchez|Numancia/.test(raw), false);
  assert.equal(/alcohol y la coca/i.test(raw), false);
  assert.equal(raw.includes("Transcripción literal"), false);
});

test("¿De qué trata La hija de dos mundos? cita la presentación y enlaza", () => {
  const r = answer(index, "¿De qué trata La hija de dos mundos?");
  assert.equal(r.found, true);
  assert.equal(r.kind, "about");
  assert.match(r.text, /«La hija de dos mundos»/);
  assert.ok(r.text.includes(index.books[0].about));
  assert.ok(r.links.some((l) => l.url.includes("#/libro/la-hija-de-dos-mundos")));
  assert.ok(r.links.some((l) => l.url.startsWith("https://youtu.be/")));
});

test("¿Quién es MAY? responde con frases literales de los libros", () => {
  const r = answer(index, "¿Quién es MAY?");
  assert.equal(r.found, true);
  assert.equal(r.kind, "who");
  assert.ok(r.items.length >= 1);
  r.items.forEach((it) => assert.match(it.quote, /\bMAY\b/));
  assertLiteral(r);
});

test("«Ave César, Ave Sánchez» no está en el índice: Numancia no se encuentra", () => {
  for (const q of ["¿Qué dice el libro de Ave César sobre Numancia?", "¿De qué trata Ave César, Ave Sánchez?"]) {
    const r = answer(index, q);
    assert.equal(r.found, false, q);
    assert.ok(r.text.startsWith(NOT_FOUND));
  }
});

test("la desaladora: cita literal de Libre como el viento", () => {
  const r = answer(index, "¿Qué dice el libro sobre la desaladora?");
  assert.equal(r.found, true);
  assert.equal(r.items[0].book, "Libre como el viento");
  assertLiteral(r);
});

test("los libros en inglés tienen PDF y se puede preguntar en inglés", () => {
  const r = answer(index, "What is The Daughter of Two Worlds about?");
  assert.equal(r.found, true);
  assert.ok(r.links.some((l) => l.url.endsWith("/assets/pdf/the-daughter-of-two-worlds.pdf")));
});

test("sin respuesta: lo dice y ofrece Grok, sin inventar", () => {
  for (const q of ["¿Quién ganó el Mundial de fútbol de 2010?", "¿Cuál es la receta de la paella valenciana?", ""]) {
    const r = answer(index, q);
    assert.equal(r.found, false, q);
    assert.ok(r.text.startsWith(NOT_FOUND));
    assert.deepEqual(r.links.map((l) => l.url), [GROK_URL]);
  }
});

test("todas las preguntas de ejemplo tienen respuesta y las citas son literales", () => {
  for (const q of EXAMPLES) {
    const r = answer(index, q);
    assert.equal(r.found, true, q);
    assertLiteral(r);
  }
});

test("detecta preguntas sobre libros y no corta en «a. C.» ni en cifras", () => {
  assert.equal(isBookQuestion(null, "¿De qué trata Nada se pierde?"), true);
  assert.equal(isBookQuestion(null, "hola"), false);
  assert.equal(sentences("Cayó en el 133 a. C. Luego vino Roma. Unos 300.000 años.").length, 3);
});

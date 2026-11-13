import test from "node:test";
import assert from "node:assert/strict";

await import("./palabra.js");
const p = globalThis.ANIBAL_PALABRA;

test("wordLinks builds the official links for one word", () => {
  const links = p.wordLinks("  Casa ");
  const by = Object.fromEntries(links.map((l) => [l.id, l.href]));
  assert.equal(by.rae, "https://dle.rae.es/casa");
  assert.equal(by.dpd, "https://www.rae.es/dpd/casa");
  assert.equal(by.sin, "https://www.wordreference.com/sinonimos/casa");
  assert.equal(by.museos, "../museos/?q=Casa");
  assert.equal(by.libros, "https://www.gutenberg.org/ebooks/search/?query=Casa");
  assert.equal(by["libros-osnews"], "../museos/#libros");
});

test("wordLinks encodes accents and spaces", () => {
  const by = Object.fromEntries(p.wordLinks("Ñandú azul").map((l) => [l.id, l.href]));
  assert.equal(by.rae, "https://dle.rae.es/" + encodeURIComponent("ñandú azul"));
  assert.equal(by.museos, "../museos/?q=" + encodeURIComponent("Ñandú azul"));
});

test("wordLinks rejects empty, URL-like or very long input", () => {
  assert.deepEqual(p.wordLinks(""), []);
  assert.deepEqual(p.wordLinks("   "), []);
  assert.deepEqual(p.wordLinks("https://evil.example"), []);
  assert.deepEqual(p.wordLinks("a/b"), []);
  assert.deepEqual(p.wordLinks("<script>"), []);
  assert.deepEqual(p.wordLinks("x".repeat(81)), []);
});

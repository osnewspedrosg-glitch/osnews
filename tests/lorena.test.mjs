// Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews) · tests (node --test tests/)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const L = require("../lorena.js");
const root = new URL("../", import.meta.url);

function store() {
  const d = new Map();
  return { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, String(v)), removeItem: (k) => d.delete(k), dump: () => Object.fromEntries(d) };
}

test("las cuatro copias del módulo son idénticas y llevan el crédito", () => {
  const main = fs.readFileSync(new URL("lorena.js", root), "utf8");
  for (const p of ["asdrubal/lorena.js", "eva-osnews/lorena.js", "azum/lorena.js"]) {
    assert.equal(fs.readFileSync(new URL(p, root), "utf8"), main, p);
  }
  assert.match(main, /Módulo Lorena — diseño de Pedro Sánchez Gómez \(OSNews\)/);
  assert.equal(L.CREDIT, "Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)");
  assert.doesNotMatch(main, /fetch\(|XMLHttpRequest|sendBeacon|WebSocket|api[_-]?key/i, "sin red ni claves");
});

test("detecta emociones en español con intensidad 0-10", () => {
  const cases = [
    ["Estoy muy triste hoy", "tristeza"], ["Tengo mucha ansiedad, estoy agobiada", "ansiedad"],
    ["¡Qué alegría, estoy feliz!", "alegria"], ["Estoy harto y cabreado", "enfado"],
    ["Tengo miedo", "miedo"], ["Me siento sola", "soledad"], ["Estoy tranquilo", "calma"],
    ["Mil gracias", "gratitud"], ["No estoy bien", "tristeza"],
  ];
  for (const [text, emo] of cases) {
    const a = L.analyzeText(text, []);
    assert.equal(a.emotion, emo, text);
    assert.ok(a.intensity >= 0 && a.intensity <= 10, text);
  }
  assert.equal(L.analyzeText("No estoy triste", []).detected, false);
  assert.ok(L.analyzeText("Estoy MUY triste!!", []).intensity > L.analyzeText("estoy triste", []).intensity);
  const neutral = L.analyzeText("¿Qué hora es?", []);
  assert.equal(neutral.detected, false);
  assert.equal(neutral.emotion, "calma");
});

test("tiene en cuenta la tendencia del historial", () => {
  const t = Date.now();
  const hist = [{ e: "tristeza", i: 7, v: -7, t: t - 60000 }];
  assert.equal(L.analyzeText("Ahora estoy mejor, contenta", hist, t).trend, "mejora");
  const carried = L.analyzeText("vale", hist, t);
  assert.equal(carried.carried, true);
  assert.equal(carried.emotion, "tristeza");
});

test("adapta la respuesta y añade 024/112 ante malestar fuerte", () => {
  const lo = L.create({ app: "t1", storage: store() });
  const sad = lo.respond("Estoy muy triste", "Cuéntame más.");
  assert.notEqual(sad.text, "Cuéntame más.");
  assert.match(sad.text, /Cuéntame más\.$/);
  assert.equal(sad.tone, "validacion");
  const calm = lo.respond("Estoy muy agobiado, tengo ansiedad", "Base.");
  assert.equal(calm.tone, "calma");
  assert.match(calm.text, /calma|respira/i);
  const crisis = lo.respond("No quiero vivir", "Base.");
  assert.match(crisis.text, /024/);
  assert.match(crisis.text, /112/);
  const handled = lo.respond("me quiero morir", "Llama al 024 ahora.");
  assert.equal((handled.text.match(/024/g) || []).length, 1, "no duplica la nota si la app ya la da");
  const en = lo.respond("Estoy muy triste", "Tell me more.", { lang: "en" });
  assert.equal(en.text, "Tell me more.", "solo da forma en español");
  const dup = lo.respond("Estoy muy triste", "Te leo y noto tristeza… lo que sientes es válido.");
  assert.equal(dup.text, "Te leo y noto tristeza… lo que sientes es válido.", "no repite la validación");
  const neutral = lo.respond("¿Qué hora es?", "Son las diez.");
  assert.equal(neutral.text, "Son las diez.");
});

test("retroalimenta las dos memorias y persiste tras recargar", () => {
  const s = store();
  let lo = L.create({ app: "t2", storage: s });
  lo.respond("Estoy muy triste por el trabajo", "Te escucho.");
  lo.respond("Me gusta la música. Ahora estoy mejor, gracias, contenta", "Me alegro.");
  lo = L.create({ app: "t2", storage: s }); // «recarga»
  const m = lo.memory();
  assert.equal(m.user.turns, 2);
  assert.equal(m.user.emo.length, 2);
  assert.ok(m.user.topics.trabajo >= 1);
  assert.deepEqual(m.user.prefs, ["la música"]);
  assert.equal(m.assistant.replies, 2);
  assert.equal(m.assistant.toneScores.tristeza.validacion, 1, "aprende que la validación ayudó");
  assert.match(m.assistant.notes[0].txt, /ayudó/);
  assert.match(lo.indicatorText(), /^Módulo Lorena · emoción detectada: alegría \d+\/10$/);
  assert.equal(JSON.stringify(s.dump()).includes("Estoy muy triste por el trabajo"), false, "no guarda frases literales");
  lo.forget();
  assert.equal(lo.memory().user.turns, 0);
  assert.equal(lo.indicatorText(), "Módulo Lorena · emoción detectada: —");
});

test("cada app tiene su espacio y lo enlaza", () => {
  const html = fs.readFileSync(new URL("index.html", root), "utf8");
  assert.match(html, /<script src="lorena\.js">/);
  assert.match(html, /OSN_LORENA\.create\(\{app:'may'/);
  const asd = fs.readFileSync(new URL("asdrubal/index.html", root), "utf8");
  assert.match(asd, /<script src="lorena\.js">/);
  assert.match(asd, /app:'asdrubal'/);
  assert.match(fs.readFileSync(new URL("eva-osnews/index.html", root), "utf8"), /lorena\.js/);
  assert.match(fs.readFileSync(new URL("azum/guided-chat-ui.js", root), "utf8"), /^import "\.\/lorena\.js";/);
  for (const sw of ["sw.js", "asdrubal/sw.js", "eva-osnews/sw.js"]) assert.match(fs.readFileSync(new URL(sw, root), "utf8"), /lorena\.js/, sw);
});

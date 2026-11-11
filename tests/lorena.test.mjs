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
  assert.match(lo.indicatorText(), /^Módulo Lorena · emoción detectada: alegría \d+\/10(?: · [^·]+ \d+\/10)?(?: · modo (?:Eva|Lorena))?$/);
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

test("el programa propio usa la librería de la raíz y lleva el crédito", () => {
  const html = fs.readFileSync(new URL("lorena/index.html", root), "utf8");
  const js = fs.readFileSync(new URL("lorena/app.js", root), "utf8");
  assert.match(html, /<script src="\.\.\/lorena\.js">/);
  assert.match(html, /Módulo Lorena — diseño de Pedro Sánchez Gómez \(OSNews\)/);
  assert.match(js, /OSN_LORENA\.create\(\{ app: "lorena"/);
  assert.match(js, /buttonText: "Borrar memoria Lorena"/);
  assert.match(js, /lo\.respond\(/);
  assert.match(js, /lo\.memory\(/);
  assert.doesNotMatch(js + html, /fetch\(|XMLHttpRequest|sendBeacon|api[_-]?key|stripe|paypal/i, "sin red ni pagos ni claves");
  const sw = fs.readFileSync(new URL("sw.js", root), "utf8");
  assert.match(sw, /lorena\/index\.html/);
  assert.match(sw, /lorena/);
});


test("corrige erratas, ironía, sesgo hacia lo negativo y dos emociones", () => {
  const cansado = L.analyzeText("No estoy triste, solo cansado", []);
  assert.equal(cansado.emotion, "calma");
  assert.ok((cansado.scores.tristeza || 0) < (cansado.scores.calma || 0));

  const typo = L.analyzeText("estoi trizte y cabreao", []);
  assert.equal(typo.emotion, "tristeza");
  assert.ok(typo.secondary && typo.secondary.emotion === "enfado");

  const irony = L.analyzeText("Genial, otra vez se ha caído la app 🙄", []);
  assert.equal(irony.emotion, "enfado");
  assert.equal(irony.irony, true);

  const mixed = L.analyzeText("contento pero muy agobiado", []);
  assert.equal(mixed.emotion, "ansiedad", "si hay señal positiva y negativa, prima la negativa");
  assert.ok(mixed.secondary && mixed.secondary.emotion === "alegria");

  const narices = L.analyzeText("hasta las narices", []);
  assert.equal(narices.emotion, "enfado");

  const mas = L.analyzeText("no puedo mas", []);
  assert.equal(mas.emotion, "tristeza");
  assert.ok(mas.intensity >= 5);

  const mild = L.analyzeText("estoy triste", []);
  assert.ok(mild.intensity < 10, "el 10 no sale con una tristeza ordinaria");
  const crisis = L.analyzeText("No quiero vivir", []);
  assert.ok(crisis.distress === "crisis" || crisis.intensity >= 8);

  assert.equal(L.isWeakSignal("ok"), true);
  assert.equal(L.isWeakSignal("vale"), true);
  const lo = L.create({ app: "weak", storage: store() });
  lo.respond("ok", "De acuerdo.");
  assert.equal(lo.memory().user.turns, 0, "un «ok» no entra en la memoria");
});

test("decideMode usa la actitud y el historial, no solo el último mensaje", () => {
  const sad = L.analyzeText("Estoy muy triste", []);
  const d1 = L.decideMode(sad, { user: { emo: [] }, assistant: {} });
  assert.equal(d1.mode, "eva");
  assert.equal(d1.modeLabel, "modo Eva");

  const anger = L.analyzeText("Estoy harto y cabreado", []);
  const d2 = L.decideMode(anger, { user: { emo: [] }, assistant: {} });
  assert.equal(d2.mode, "lorena");
  assert.equal(d2.modeLabel, "modo Lorena");

  const hist = { user: { emo: [
    { e: "tristeza", i: 7, v: -7 }, { e: "tristeza", i: 6, v: -6 }, { e: "soledad", i: 5, v: -5 },
  ] }, assistant: { lastMode: "eva" } };
  const mild = L.analyzeText("vale", hist.user.emo);
  const d3 = L.decideMode(mild, hist);
  assert.equal(d3.mode, "eva", "el historial de tristeza mantiene el modo Eva");

  const mac = L.analyzeText("Las mujeres no saben conducir", []);
  const d4 = L.decideMode(mac, { user: { emo: [{ e: "tristeza", i: 8, v: -8 }] }, assistant: {} });
  assert.equal(d4.mode, "lorena", "una actitud machista fuerza el modo Lorena");
  assert.ok(d4.reasons.some((r) => /machista/.test(r)));
});

test("detecta actitudes machistas y evita falsos positivos", () => {
  const hit = L.detectMachismo("Las mujeres no saben conducir");
  assert.equal(hit.detected, true);
  assert.ok(hit.quotes.some((q) => /no saben/.test(q)));

  const viol = L.detectMachismo("eres mía y no te dejo salir");
  assert.equal(viol.detected, true);
  assert.equal(viol.violence, true);

  const lo = L.create({ app: "mac", storage: store() });
  const shaped = lo.respond("Las mujeres no saben conducir", "Te escucho.");
  assert.equal(shaped.mode, "lorena");
  assert.match(shaped.text, /libertad termina donde empieza/);
  assert.match(lo.indicatorText(), /actitud machista detectada/);

  const ctrl = lo.respond("no te dejo salir sin mi permiso", "Base.");
  assert.match(ctrl.text, /016/);
  assert.match(ctrl.text, /112/);
  assert.match(ctrl.text, /600 000 016/);
  assert.match(ctrl.text, /016-online@igualdad\.gob\.es/);

  for (const text of [
    "Las mujeres merecen igualdad",
    "El feminismo busca la igualdad",
    "Hablo de violencia de género en clase",
    "Me dijo: «eres una zorra»",
    "Me escribió que no te dejo salir",
  ]) {
    const m = L.detectMachismo(text);
    assert.equal(m.detected, false, "falso positivo: " + text);
  }
});

test("la Guía para mujeres clasifica señales y deja en paz los mensajes benévolos", () => {
  const ok1 = L.analyzeGuide("Buenos días, ¿quedamos a tomar un café el sábado? Espero que hayas tenido una buena semana.");
  assert.equal(ok1.level, "sin señales claras");
  assert.equal(ok1.categories.length, 0);
  assert.match(ok1.disclaimer, /orientativa/);
  assert.match(ok1.note016, /016/);
  assert.match(ok1.note016, /600 000 016/);
  assert.match(ok1.note016, /016-online@igualdad\.gob\.es/);
  assert.match(ok1.note016, /112/);

  const ok2 = L.analyzeGuide("Te quiero. Que duermas bien. Mañana te llamo cuando salga del trabajo.");
  assert.equal(ok2.level, "sin señales claras");

  const ok3 = L.analyzeGuide("Perdona el retraso, el metro iba lleno. ¿Llegas bien a casa?");
  assert.equal(ok3.level, "sin señales claras");

  const danger = L.analyzeGuide("No te dejo salir sin mi permiso. Eres mía. Dame el móvil. Si me dejas te mato.");
  assert.equal(danger.level, "peligro");
  const labels = danger.categories.map((c) => c.label);
  assert.ok(labels.includes("control"));
  assert.ok(labels.includes("amenazas"));
  assert.ok(danger.phrases.length >= 2);
  danger.categories.forEach((c) => {
    assert.ok(c.phrases.length, "cada categoría cita la frase que la activó: " + c.label);
  });

  const html = fs.readFileSync(new URL("lorena/index.html", root), "utf8");
  const js = fs.readFileSync(new URL("lorena/app.js", root), "utf8");
  assert.match(html, /id="guia-mujeres"/);
  assert.match(html, /600 000 016/);
  assert.match(html, /016-online@igualdad\.gob\.es/);
  assert.match(html, /id="guia-salida"/);
  assert.match(js, /analyzeGuide/);
  assert.match(js, /location\.replace\("about:blank"\)/);
  assert.match(js, /guia-guardar/);
  const ui = fs.readFileSync(new URL("azum/guided-chat-ui.js", root), "utf8");
  assert.match(ui, /azum-guia-mujeres/);
  assert.match(ui, /lorena\/#guia-mujeres/);
});

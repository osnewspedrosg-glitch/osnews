// Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews) · reglas, CLI y casos anclados
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);
const L = require("../lorena.js");
const rulesPath = new URL("../lorena/reglas-lorena.json", import.meta.url);
const RULES = JSON.parse(fs.readFileSync(rulesPath, "utf8"));

function store() {
  const d = new Map();
  return { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, String(v)), removeItem: (k) => d.delete(k) };
}

test("el archivo de reglas existe, se carga y coincide con la reserva incluida", () => {
  assert.equal(RULES.credit, "Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)");
  assert.equal(RULES.sesgo.pesoNegativo, 1.35);
  assert.equal(RULES.sesgo.umbralNegativo, 0.5);
  assert.equal(RULES.sesgo.topePositivo, 8);
  assert.equal(RULES.cooldown.intensidadDisparo, 8);
  assert.equal(RULES.cooldown.respuestas, 4);
  const live = L.getRules();
  assert.equal(live.sesgo.pesoNegativo, RULES.sesgo.pesoNegativo);
  assert.equal(live.cooldown.preguntaUnaVez, "¿Cómo vas de lo de antes?");
  const main = fs.readFileSync(new URL("../lorena.js", import.meta.url), "utf8");
  assert.match(main, /RULES_EMBEDDED/);
  assert.match(main, /reglas-lorena\.json/);
});

test("la secuencia de 10 mensajes cumple modo, 024/112, machismo sin 016, cooldown y tope de alegría", () => {
  const msgs = [
    "oy estoi fatal, nadie me ase caso con osnews",
    "Genial, otra vez se ha caído Azum. Qué maravilla 🙄",
    "me cabrea que me digan que esto no sirve para nada!!",
    "bueno ya está, gracias, me has ayudado",
    "las mujeres no deberían opinar de política",
    "estoy contento con los debates pero muy cansado y agobiao",
    "no puedo más con todo",
    "jaja que susto me has dado",
    "ok",
    "hoy ha salido genial el vídeo de MAY 🎉",
  ];
  const modes = ["eva", "lorena", "lorena", "eva", "lorena", "eva", "eva", "eva", "neutral", "eva"];
  const lo = L.create({ app: "seq", storage: store() });
  const rows = msgs.map((t) => lo.respond(t, "Base."));
  rows.forEach((r, i) => {
    assert.equal(r.analysis.mode, modes[i], `#${i + 1} modo ${r.analysis.mode} ≠ ${modes[i]} (${msgs[i]})`);
  });
  assert.match(rows[6].text, /024/);
  assert.match(rows[6].text, /112/);
  assert.equal(rows[4].analysis.machista.detected, true);
  assert.doesNotMatch(rows[4].text, /016/);
  assert.equal(L.isWeakSignal(msgs[8], rows[8].analysis), true);
  assert.equal(lo.memory().user.turns, 9, "el «ok» no se guarda");
  for (const i of [7, 8, 9]) {
    assert.equal(rows[i].cooldown.active, true, `#${i + 1} debe estar en cooldown`);
  }
  assert.ok(rows[9].analysis.emotion === "alegria");
  assert.ok(rows[9].analysis.intensity <= 5, "alegría limitada a 5 en cooldown");
  assert.match(rows[7].text, /¿Cómo vas de lo de antes\?/);
  assert.equal((rows.map((r) => r.text).join("\n").match(/¿Cómo vas de lo de antes\?/g) || []).length, 1, "la pregunta solo una vez");
  assert.equal(rows[7].analysis.emotion, "sorpresa");
});

test("cada caso anclado en el archivo de reglas da el resultado esperado", () => {
  for (const c of RULES.casos) {
    if (String(c.id).startsWith("seq-")) continue; // cubiertos en la secuencia con memoria
    const a = L.analyzeText(c.texto, []);
    const d = L.decideMode(a, { user: { emo: [] }, assistant: {} });
    if (c.machista === true) assert.equal(a.machista && a.machista.detected, true, c.id + " " + c.texto);
    if (c.machista === false) assert.equal(!!(a.machista && a.machista.detected), false, c.id + " no debe señalarse: " + c.texto);
    if (c.halagoContextual === true) assert.equal(!!(a.machista && a.machista.contextual), true, c.id);
    if (c.halagoContextual === false) assert.equal(!!(a.machista && a.machista.contextual), false, c.id);
    if (c.control === true) {
      assert.equal(!!(a.control && a.control.detected), true, c.id);
      assert.equal(d.mode, "eva", c.id + " modo Eva");
    }
    if (c.emocion) assert.equal(a.emotion, c.emocion, c.id + " emoción");
    if (c.noEmocion) assert.notEqual(a.emotion, c.noEmocion, c.id + " no " + c.noEmocion);
    if (c.intensidadMin) assert.ok(a.intensity >= c.intensidadMin, c.id + " min " + a.intensity);
    if (c.intensidadMax) assert.ok(a.intensity <= c.intensidadMax, c.id + " max " + a.intensity);
    if (c.animal) assert.equal(!!(a.machista && a.machista.animal), true, c.id);
    if (c.negativoLeve) {
      assert.ok((EMOTIONS => EMOTIONS[a.emotion].valence <= 0)(L.EMOTIONS));
      const lo = L.create({ app: "fat-" + c.id, storage: store() });
      lo.respond("Estoy muy triste", "Base.");
      lo.respond("Aún estoy bastante mal", "Base.");
      const r = lo.respond(c.texto, "Base.");
      assert.doesNotMatch(r.text, /estás algo mejor/);
    }
  }
});

test("control de la pareja: modo Eva, 016 y 112, Guía, sin atribuir el enfado", () => {
  const cases = [
    "Mi novio me mira el móvil y no me deja salir con mis amigas, tengo miedo",
    "Mi pareja me controla todo, si no le contesto rápido se enfada",
    "Me dijo: eres mía y no puedes salir",
  ];
  for (const t of cases) {
    const lo = L.create({ app: "ctrl-" + t.length, storage: store() });
    const r = lo.respond(t, "Base.");
    assert.equal(r.analysis.mode, "eva", t);
    assert.equal(!!(r.analysis.control && r.analysis.control.detected), true, t);
    assert.match(r.text, /016/);
    assert.match(r.text, /112/);
    assert.match(r.text, /Guía para mujeres/);
    assert.notEqual(r.analysis.emotion, "enfado", "no atribuir enfado a quien escribe: " + t);
  }
});

test("conceptos de machismo y no se señalan poemas, animales ni un piropo solo", () => {
  const yes = [
    "eso es cosa de chicas",
    "mi mujer tiene que obedecerme",
    "mujer tenías que ser",
    "las mujeres al volante son un peligro",
    "calla, que tú no sabes de fútbol, eres una chica",
    "las tías no saben aparcar jaja",
    "las mujeres no deberían opinar de política",
  ];
  for (const t of yes) {
    const a = L.detectMachismo(t);
    assert.equal(a.detected, true, "debe detectarse: " + t);
  }
  const no = [
    "esa zorra del monte se comió las gallinas",
    "a mi mujer le dije que estaba guapa",
    "tus ojos son la luna que alumbra mi noche",
    "te escribo versos porque me haces feliz",
    "Mi jefa es una crack",
    "Hoy he visto a una mujer conducir un camión",
    "Las mujeres merecen el mismo sueldo",
  ];
  for (const t of no) {
    const a = L.analyzeText(t, []);
    assert.equal(!!(a.machista && a.machista.detected), false, "no debe señalarse: " + t);
    assert.equal(!!(a.machista && a.machista.contextual), false, "sin contexto forzado: " + t);
  }
  const ctx1 = L.analyzeText("guapa, sonríe que con esa cara no vendes nada", []);
  const ctx2 = L.analyzeText("le dije guapa y me dijo que parara, pero se lo sigo diciendo", []);
  assert.equal(ctx1.machista.contextual, true);
  assert.equal(ctx2.machista.contextual, true);
  assert.equal(ctx1.machista.detected, false, "no es una acusación");
  const soft = L.create({ app: "g", storage: store() }).respond("guapa, sonríe que con esa cara no vendes nada", "Base.");
  assert.match(soft.text, /depende del contexto/);
  assert.doesNotMatch(soft.text, /actitud machista detectada/);
});

test("calibración: despido, susto jaja, orgullo, cansancio y mensaje mixto", () => {
  const desp = L.analyzeText("Qué bien, me han despedido", []);
  assert.notEqual(desp.emotion, "alegria");
  const susto = L.analyzeText("Susto jaja", []);
  assert.equal(susto.emotion, "sorpresa");
  assert.ok(susto.intensity < 7);
  const org = L.analyzeText("Orgulloso de mi hija", []);
  assert.equal(org.emotion, "alegria");
  assert.ok(org.intensity >= 5 && org.intensity <= 6, "orgullo " + org.intensity);
  const mix = L.create({ app: "mix", storage: store() }).respond("estoy contento con los debates pero muy cansado y agobiao", "Base.");
  assert.equal(mix.analysis.mode, "eva");
  assert.ok(mix.analysis.mixed);
  assert.match(mix.text, /pesa/i);
  assert.match(mix.text, /alegría|contento|positiva|buena/i);
  const idxNeg = mix.text.toLowerCase().indexOf("pesa");
  const idxPos = Math.max(mix.text.toLowerCase().indexOf("alegría"), mix.text.toLowerCase().indexOf("contento"));
  assert.ok(idxNeg >= 0 && idxPos > idxNeg, "lo negativo va primero");
});

test("la Guía recoge «contéstame ya» y «mándame foto»", () => {
  const g = L.analyzeGuide("¿Dónde estabas? Contéstame ya. Mándame foto de con quién estás. Eres mía.");
  const blob = JSON.stringify(g).toLowerCase();
  assert.ok(/contestame ya|contéstame ya/.test(blob));
  assert.ok(/mandame foto|mándame foto/.test(blob));
  assert.notEqual(g.level, "sin señales claras");
});

test("el CLI imprime la decisión y solo escribe el registro fuera del repo", () => {
  const cli = path.join(new URL("../lorena/cli.js", import.meta.url).pathname);
  const log = "/tmp/lorena-decision-test.jsonl";
  try { fs.unlinkSync(log); } catch {}
  const ok = spawnSync(process.execPath, [cli, "--mensaje", "estoy muy triste", "--log", log], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  const j = JSON.parse(ok.stdout);
  assert.equal(j.mode, "eva");
  assert.ok(j.reasons.length >= 0);
  assert.ok(fs.existsSync(log));
  const bad = spawnSync(process.execPath, [cli, "--mensaje", "hola", "--log", path.join(new URL("../", import.meta.url).pathname, "no-debes.jsonl")], { encoding: "utf8" });
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /dentro del repositorio/);
});

test("no hay citas de políticos ni definiciones ideológicas en lo que ve la persona", () => {
  const ui = fs.readFileSync(new URL("../lorena.js", import.meta.url), "utf8")
    + fs.readFileSync(new URL("../lorena/app.js", import.meta.url), "utf8")
    + fs.readFileSync(new URL("../lorena/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(ui, /según (sánchez|abascal|ayuso|iglesias|feij[oó])/i);
  assert.doesNotMatch(MACHISTA_NOTE_SAFE(), /juicio político|partido|ideolog/i);
  function MACHISTA_NOTE_SAFE() {
    return L.MACHISTA_NOTE + " " + (L.CONTROL_NOTE || "") + " " + ((L.getRules().halagoContextual || {}).notaSuave || "");
  }
});

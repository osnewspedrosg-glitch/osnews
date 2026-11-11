#!/usr/bin/env node
/* Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)
   Uso (Eva Secretaria lo lanza antes de responder):
     node lorena/cli.js --mensaje "texto" --memoria /tmp/lorena-mem.json --log /tmp/lorena-decision.jsonl
   El registro (--log) debe estar fuera del repositorio. */
"use strict";

var fs = require("fs");
var path = require("path");
var L = require("../lorena.js");

function arg(name, alias) {
  var i = process.argv.indexOf(name);
  if (i < 0 && alias) i = process.argv.indexOf(alias);
  if (i >= 0 && process.argv[i + 1] && process.argv[i + 1].charAt(0) !== "-") return process.argv[i + 1];
  return null;
}
function has(name) { return process.argv.indexOf(name) >= 0; }

function repoRoot() { return path.resolve(__dirname, ".."); }
function assertLogOutsideRepo(logPath) {
  var resolved = path.resolve(logPath);
  var root = repoRoot();
  if (resolved === root || resolved.indexOf(root + path.sep) === 0) {
    throw new Error("El registro de decisiones no debe guardarse dentro del repositorio. Pasa una ruta fuera, por ejemplo --log /tmp/lorena-decision.jsonl");
  }
}

function usage() {
  return [
    "Uso: node lorena/cli.js --mensaje \"texto\" [--memoria /tmp/lorena-mem.json] [--log /tmp/lorena-decision.jsonl] [--reglas lorena/reglas-lorena.json]",
    "También se admite el mensaje como argumento posicional."
  ].join("\n");
}

function storeFrom(obj) {
  var d = {};
  if (obj && typeof obj === "object") {
    if (obj.user) d["lorena-cli-usuario-v1"] = JSON.stringify(obj.user);
    if (obj.assistant) d["lorena-cli-asistente-v1"] = JSON.stringify(obj.assistant);
  }
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
    setItem: function (k, v) { d[k] = String(v); },
    removeItem: function (k) { delete d[k]; },
    _dump: function () { return d; }
  };
}

function main() {
  if (has("-h") || has("--help")) { console.log(usage()); process.exit(0); }
  var positional = process.argv.slice(2).filter(function (a, i, arr) {
    if (a.charAt(0) === "-") return false;
    var prev = arr[i - 1] || "";
    return !/^--(mensaje|message|memoria|memory|log|reglas|rules)$/.test(prev);
  });
  var text = arg("--mensaje", "--message") || positional[0];
  if (!text) { console.error(usage()); process.exit(1); }

  var rulesPath = arg("--reglas", "--rules");
  if (rulesPath && fs.existsSync(rulesPath)) {
    L.applyRules(JSON.parse(fs.readFileSync(rulesPath, "utf8")));
  }

  var memPath = arg("--memoria", "--memory");
  var mem = {};
  if (memPath && fs.existsSync(memPath)) {
    try { mem = JSON.parse(fs.readFileSync(memPath, "utf8")) || {}; } catch (e) { mem = {}; }
  }
  var storage = storeFrom(mem);
  var lo = L.create({ app: "cli", assistant: "Lorena", storage: storage });
  var out = lo.respond(text, "");
  var a = out.analysis || {};
  var result = {
    credit: L.CREDIT,
    version: L.VERSION,
    emotion: a.emotion || null,
    label: a.label || null,
    intensity: a.intensity,
    secondary: a.secondary || null,
    scores: a.scores || {},
    mode: a.mode || out.mode,
    modeLabel: a.modeLabel || out.modeLabel,
    machista: !!(a.machista && a.machista.detected),
    contextual: !!(a.machista && a.machista.contextual),
    control: !!(a.control && a.control.detected),
    helplines: out.helplines || a.helplines || [],
    cooldown: out.cooldown || { active: false, remaining: 0, asked: false },
    reasons: out.reasons || a.reasons || [],
    distress: a.distress || null,
    irony: !!a.irony,
    mixed: !!a.mixed,
    stored: !L.isWeakSignal(text, a)
  };

  var logPath = arg("--log");
  if (logPath) {
    assertLogOutsideRepo(logPath);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({ t: new Date().toISOString(), mensaje: text, decision: result }) + "\n", "utf8");
  }
  if (memPath) {
    var m = lo.memory();
    fs.writeFileSync(memPath, JSON.stringify({ user: m.user, assistant: m.assistant }, null, 2), "utf8");
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

try { main(); } catch (err) {
  console.error(err.message || err);
  process.exit(1);
}

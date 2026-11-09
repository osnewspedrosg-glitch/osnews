import test from "node:test";
import assert from "node:assert/strict";
import {
  createEntry, dossier, dossierText, loadEntries, removeEntry, saveEntries, upsertEntry, deliverToMay, markSent, MAY_DELIVERY,
} from "./logic.js";
import { RELAY_URL, payloadFor } from "./may-adapter.js";

function store() {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

const sample = {
  title: "Corte de agua en el barrio",
  country: "Colombia",
  description: "El suministro se interrumpió el martes según el aviso enlazado.",
  factDate: "2026-11-03",
  kind: "hecho",
  status: "pendiente-contraste",
  sourcesText: "https://x.com/example/status/1\njavascript:alert(1)",
};

test("a complaint is stored, reloaded, edited and deleted without a MAY decision", () => {
  const bad = createEntry(sample);
  assert.equal(bad.ok, false);
  const made = createEntry({ ...sample, sourcesText: "https://x.com/example/status/1" });
  assert.equal(made.ok, true);
  assert.equal(made.entry.mayDecision, null);
  const memory = store();
  memory.setItem("otra-app", "sigue");
  assert.equal(saveEntries(memory, [made.entry]).ok, true);
  const loaded = loadEntries(memory);
  assert.equal(loaded.entries[0].title, made.entry.title);
  const edited = createEntry({ ...made.entry, title: "Aviso de corte de agua", sourcesText: made.entry.urls[0], id: made.entry.id, createdAt: made.entry.createdAt });
  assert.equal(edited.ok, true);
  saveEntries(memory, upsertEntry(loaded.entries, edited.entry));
  assert.equal(loadEntries(memory).entries[0].title, "Aviso de corte de agua");
  saveEntries(memory, removeEntry(loadEntries(memory).entries, made.entry.id));
  assert.equal(loadEntries(memory).entries.length, 0);
  assert.equal(memory.getItem("otra-app"), "sigue");
});

test("javascript URLs are rejected and the dossier does not claim a MAY decision", () => {
  const blocked = createEntry({ ...sample, sourcesText: "javascript:alert(1)" });
  assert.equal(blocked.ok, false);
  const made = createEntry({ ...sample, sourcesText: "https://example.org/acta.pdf" });
  const text = dossierText(made.entry);
  assert.match(text, /Decisión de MAY: ninguna/);
  assert.match(text, /por contrastar/);
  assert.equal(dossier(made.entry).decisionMay, null);
});

test("storage starts empty and a full disk is visible", () => {
  const memory = store();
  assert.deepEqual(loadEntries(memory).entries, []);
  const full = { getItem: () => "[]", setItem: () => { throw new Error("quota"); } };
  assert.match(saveEntries(full, []).error, /quota/);
});

const made = () => createEntry({ ...sample, sourcesText: "https://example.org/acta.pdf" }).entry;

test("sending posts only dossier fields to the relay, never a key", async () => {
  let seen;
  const fake = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ ok: true }), { status: 200 }); };
  const result = await deliverToMay(made(), fake);
  assert.equal(result.sent, true);
  assert.match(result.message, /Recibirlo no significa publicarlo; MAY decidirá tras contrastar/);
  assert.equal(seen.url, RELAY_URL);
  assert.equal(seen.init.headers.Authorization, undefined);
  assert.deepEqual(Object.keys(JSON.parse(seen.init.body)).sort(), Object.keys(payloadFor(made())).sort());
});

test("a failed send is reported and the local copy is untouched", async () => {
  const memory = store();
  const entry = made();
  saveEntries(memory, [entry]);
  const down = await deliverToMay(entry, async () => { throw new Error("offline"); });
  assert.equal(down.sent, false);
  assert.match(down.reason, /copia local sigue guardada/);
  const refused = await deliverToMay(entry, async () => new Response(JSON.stringify({ ok: false, error: "La entrega a MAY aún no está configurada." }), { status: 503 }));
  assert.equal(refused.sent, false);
  assert.match(refused.reason, /no está configurada/);
  assert.equal(loadEntries(memory).entries[0].id, entry.id);
  assert.equal(markSent(entry, "2026-11-09T07:00:00Z").sentAt, "2026-11-09T07:00:00Z");
});

test("the banner says not connected until the end-to-end test flips it", () => {
  assert.equal(MAY_DELIVERY.connected, false);
  assert.equal(MAY_DELIVERY.label, "Conexión con MAY: no conectada");
});

test("the page source holds no webhook key or webhook URL", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const f of ["app.js", "logic.js", "may-adapter.js", "index.html"]) {
    const text = await readFile(new URL(`./${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(text, /Bearer|EVA_WEBHOOK|cursor\.com\/.*webhook/i, f);
  }
});

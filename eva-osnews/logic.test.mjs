import test from "node:test";
import assert from "node:assert/strict";
import {
  createEntry, dossier, dossierText, loadEntries, removeEntry, saveEntries, upsertEntry, deliverToMay,
} from "./logic.js";

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
  assert.equal(deliverToMay().sent, false);
});

test("storage starts empty and a full disk is visible", () => {
  const memory = store();
  assert.deepEqual(loadEntries(memory).entries, []);
  const full = { getItem: () => "[]", setItem: () => { throw new Error("quota"); } };
  assert.match(saveEntries(full, []).error, /quota/);
});

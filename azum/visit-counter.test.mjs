import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PAGE_PATH,
  counterUrl,
  labelFromPayload,
  loadVisitCount,
  shouldRecord,
  visitLine,
} from "./visit-counter.js";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("the Azum counter reads only this page path", async () => {
  assert.equal(PAGE_PATH, "/osnews/azum/");
  assert.equal(counterUrl().includes("TOTAL"), false);
  assert.match(counterUrl(), /%2Fosnews%2Fazum%2F\.json$/);
  const calls = [];
  const result = await loadVisitCount(async (url) => {
    calls.push(url);
    return jsonResponse(200, { count: "12", count_unique: "12" });
  });
  assert.equal(result.state, "ready");
  assert.equal(result.text, "12");
  assert.equal(visitLine(result), "Visitas de esta página: 12");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].includes("TOTAL"), false);
  assert.equal(shouldRecord({ hostname: "127.0.0.1", pathname: "/osnews/azum/" }), false);
  assert.equal(shouldRecord({ hostname: "osnewspedrosg-glitch.github.io", pathname: "/osnews/azum/" }), true);
  assert.equal(shouldRecord({ hostname: "osnewspedrosg-glitch.github.io", pathname: "/osnews/" }), false);
});

test("a missing or refused GoatCounter response is not shown as zero", async () => {
  for (const response of [jsonResponse(404, {}), jsonResponse(403, {}), null]) {
    const result = await loadVisitCount(async () => {
      if (!response) throw new Error("offline");
      return response;
    });
    assert.equal(result.state, "unavailable");
    assert.equal(result.text, "No disponible");
    assert.equal(result.text.includes("0"), false);
  }
  assert.equal(labelFromPayload({ count: "" }), null);
  const siteTotal = await loadVisitCount(async () => jsonResponse(200, { count: "4" }), "TOTAL");
  assert.equal(siteTotal.text, "No disponible");
});

test("the page keeps the guided chat, sections and does not count from the test file", () => {
  const page = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
  assert.match(page, /visit-counter-ui\.js/);
  assert.match(page, /guided-chat-ui\.js/);
  for (const label of ["Conversar", "Comparar", "Rueda", "Papeles", "Pagos", "Fuentes", "Pruebas", "Leer en local"]) {
    assert.equal(page.includes(label), true, label);
  }
  assert.equal(page.includes("gc.zgo.at/count.js"), false);
});

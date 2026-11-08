/**
 * Public GoatCounter total for this Azum page only.
 * The site already uses https://osnews-may.goatcounter.com. count and
 * count_unique are the same legacy pair; this shows count for one path.
 */
export const PAGE_PATH = "/osnews/azum/";
export const COUNTER_SITE = "https://osnews-may.goatcounter.com";
export const COUNT_SCRIPT = "https://gc.zgo.at/count.js";

export function counterUrl(path = PAGE_PATH) {
  return `${COUNTER_SITE}/counter/${encodeURIComponent(path)}.json`;
}

export function shouldRecord(locationLike) {
  const host = locationLike?.hostname || "";
  const path = locationLike?.pathname || "";
  if (host !== "osnewspedrosg-glitch.github.io") return false;
  return path === "/osnews/azum" || path === "/osnews/azum/" || path === "/osnews/azum/index.html";
}

export function labelFromPayload(payload) {
  const count = payload?.count;
  if (typeof count !== "string" || !/\d/.test(count)) return null;
  return count;
}

export async function loadVisitCount(fetchImpl, path = PAGE_PATH) {
  if (path === "TOTAL" || path.includes("TOTAL")) {
    return { state: "unavailable", text: "No disponible" };
  }
  try {
    const response = await fetchImpl(counterUrl(path), { cache: "no-store" });
    if (!response?.ok) return { state: "unavailable", text: "No disponible" };
    const count = labelFromPayload(await response.json());
    if (!count) return { state: "unavailable", text: "No disponible" };
    return { state: "ready", text: count };
  } catch {
    return { state: "unavailable", text: "No disponible" };
  }
}

export function visitLine(result) {
  return `Visitas de esta página: ${result?.text || "No disponible"}`;
}

export function recordVisit(doc, locationLike = doc.defaultView?.location) {
  if (!shouldRecord(locationLike) || doc.getElementById("azum-goatcounter")) return false;
  const script = doc.createElement("script");
  script.id = "azum-goatcounter";
  script.async = true;
  script.src = COUNT_SCRIPT;
  script.dataset.goatcounter = `${COUNTER_SITE}/count`;
  script.dataset.goatcounterSettings = JSON.stringify({
    allow_local: false,
    path: PAGE_PATH,
  });
  doc.head.appendChild(script);
  return true;
}

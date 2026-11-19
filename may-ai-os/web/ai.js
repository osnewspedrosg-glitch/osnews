const MAY_AI = (() => {
  const AVISO = "Orientativo, consulta a tu médico.";
  const AVISO_AYUDA =
    "Si lo estás pasando muy mal, en España puedes llamar al 024, la línea de atención a la conducta suicida, o al 112 si es una emergencia. Es solo una orientación; yo no sustituyo a un profesional.";
  let datos = { tecnicas: [], recursos: [] };

  async function cargar() {
    const r = await fetch("conocimiento.json");
    if (!r.ok) throw new Error("No he podido cargar la base de conocimiento.");
    datos = await r.json();
    return datos;
  }
  function tecnicas() { return datos.tecnicas || []; }
  function recursos() { return datos.recursos || []; }
  function elegir(etiquetas, limite) {
    const wanted = new Set((etiquetas || []).map((e) => String(e).toLowerCase()).filter(Boolean));
    const pts = [];
    for (const t of tecnicas()) {
      const tags = new Set((t.etiquetas || []).map((x) => String(x).toLowerCase()));
      let n = 0;
      for (const w of wanted) if (tags.has(w)) n++;
      if (n) pts.push([n, t]);
    }
    pts.sort((a, b) => b[0] - a[0]);
    const out = [], seen = new Set();
    for (const [, t] of pts) {
      if (seen.has(t.id)) continue;
      out.push(t);
      seen.add(t.id);
      if (out.length >= (limite || 2)) break;
    }
    return out;
  }
  function formatear(mensaje, tecs, alta) {
    const partes = [mensaje];
    for (const t of tecs || []) {
      partes.push("", t.titulo || "", t.resumen || "");
      if (t.cita_breve || t.fuente) partes.push("(" + (t.cita_breve || t.fuente) + ".)");
    }
    if (alta) partes.push("", AVISO_AYUDA);
    partes.push("", AVISO);
    return partes.filter((x, i) => x !== "" || i === 0).join("\n").replace(/\n{3,}/g, "\n\n");
  }
  function contextoBot(tecs) {
    if (!tecs || !tecs.length) return "";
    const lineas = [
      "El usuario ha pedido apoyo. Puedes tener en cuenta estas técnicas (resúmenes propios de MAY, no cites como si fueran el libro literal):",
    ];
    for (const t of tecs) {
      lineas.push("- " + t.titulo + ": " + t.resumen + " (" + (t.cita_breve || t.fuente) + ")");
    }
    lineas.push(AVISO);
    return lineas.join("\n");
  }
  return { cargar, tecnicas, recursos, elegir, formatear, contextoBot, AVISO, AVISO_AYUDA };
})();

/* OSNews — contador anónimo GoatCounter (visitas + uso de la app).
   Cuenta osnews-may. Sin cookies ni datos personales. Sin claves en el código.
   En GitHub Pages el script de GoatCounter cuenta la visita (ruta de la página).
   El uso se envía una vez por carga, al primer clic o tecla, a data-uso.
   En local el script puede cargar, pero no se envía el evento de uso. */
(function (root) {
  "use strict";

  var HOST_LIVE = "osnewspedrosg-glitch.github.io";
  var GC_SRC = "https://gc.zgo.at/count.js";
  var GC_COUNT = "https://osnews-may.goatcounter.com/count";

  function esLive(loc) {
    loc = loc || (typeof location !== "undefined" ? location : {});
    return loc.hostname === HOST_LIVE;
  }

  function ensureGoatScript(doc) {
    doc = doc || document;
    var existing = doc.querySelector("script[data-goatcounter]");
    if (existing) return existing;
    var s = doc.createElement("script");
    s.async = true;
    s.src = GC_SRC;
    s.setAttribute("data-goatcounter", GC_COUNT);
    (doc.head || doc.documentElement).appendChild(s);
    return s;
  }

  function optsFrom(script) {
    script = script || (typeof document !== "undefined" ? document.currentScript : null);
    return {
      pathUso: (script && script.getAttribute("data-uso")) || "",
      titleUso: (script && script.getAttribute("data-uso-titulo")) || "Uso de la app"
    };
  }

  function iniciar(options, api) {
    options = options || optsFrom();
    api = api || root;
    var doc = api.document || (typeof document !== "undefined" ? document : null);
    var loc = api.location || (typeof location !== "undefined" ? location : {});
    var sent = false;
    var tries = 0;
    if (doc) ensureGoatScript(doc);

    function contarUso() {
      if (sent) return true;
      if (!esLive(loc)) return false;
      var gc = api.goatcounter || root.goatcounter;
      if (!gc || typeof gc.count !== "function") {
        if (tries < 10) {
          tries += 1;
          (api.setTimeout || setTimeout)(contarUso, 300);
        }
        return false;
      }
      if (!options.pathUso) return false;
      sent = true;
      try {
        gc.count({ path: options.pathUso, title: options.titleUso, event: true });
      } catch (e) {}
      return true;
    }

    if (doc && doc.addEventListener) {
      doc.addEventListener("click", contarUso, { capture: true });
      doc.addEventListener("keydown", contarUso, { capture: true });
    }
    return { esLive: function () { return esLive(loc); }, contarUso: contarUso, ensureGoatScript: ensureGoatScript };
  }

  var api = {
    HOST_LIVE: HOST_LIVE,
    GC_SRC: GC_SRC,
    GC_COUNT: GC_COUNT,
    esLive: esLive,
    ensureGoatScript: ensureGoatScript,
    iniciar: iniciar
  };
  root.osnewsContador = api;

  if (typeof document !== "undefined" && document.currentScript &&
      document.currentScript.getAttribute("data-auto") !== "0") {
    iniciar();
  }
})(typeof window !== "undefined" ? window : globalThis);

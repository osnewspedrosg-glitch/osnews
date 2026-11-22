/* Chat del debate OSNews. Sin claves. Sin servicios de pago.
   La votación y el chat públicos usan giscus (GitHub Discussions).
   Hasta que Pedro active Discussions e instale giscus, el recuento
   no puede ser compartido: se indica con claridad y se ofrece YouTube. */
(function () {
  "use strict";

  var HOST_LIVE = "osnewspedrosg-glitch.github.io";
  var GC = "https://osnews-may.goatcounter.com";
  var PATH_VISITAS = "/osnews/chat-debate/";
  var PATH_USO = "/osnews/chat-debate/uso";
  var YT = "https://www.youtube.com/watch?v=WIaD2qZXLiQ";

  /* category y categoryId se rellenan cuando Discussions y giscus estén listos.
     repoId ya es el del repositorio público osnewspedrosg-glitch/osnews. */
  var GISCUS = {
    repo: "osnewspedrosg-glitch/osnews",
    repoId: "R_kgDOVgxwPA",
    category: "",
    categoryId: "",
    mapping: "specific",
    term: "Chat del debate OSNews · castración química · 2026-11-22",
    reactionsEnabled: "1",
    emitMetadata: "1",
    inputPosition: "top",
    theme: "dark_dimmed",
    lang: "es"
  };

  var OPCIONES = [
    { id: "a", key: "THUMBS_UP", emoji: "👍", label: "A) Primero, los derechos del condenado" },
    { id: "b", key: "HEART", emoji: "❤️", label: "B) Primero, la salud de la víctima" },
    { id: "c", key: "HOORAY", emoji: "🎉", label: "C) Las dos cosas a la vez" }
  ];

  function $(id) { return document.getElementById(id); }
  function esLive() { return location.hostname === HOST_LIVE; }
  function giscusListo() { return !!(GISCUS.category && GISCUS.categoryId); }

  function cuentaDe(counts, key) {
    if (!counts) return null;
    if (typeof counts[key] === "number") return counts[key];
    var alt = key.toLowerCase();
    if (typeof counts[alt] === "number") return counts[alt];
    return 0;
  }

  function pintarVotos(counts) {
    var host = $("votos");
    if (!host) return;
    var nums = OPCIONES.map(function (o) { return counts ? cuentaDe(counts, o.key) : null; });
    var total = 0;
    var hay = counts != null;
    if (hay) {
      nums.forEach(function (n) { total += n || 0; });
    }
    host.innerHTML = "";
    OPCIONES.forEach(function (o, i) {
      var n = nums[i];
      var pct = hay && total > 0 ? Math.round((n || 0) * 100 / total) : 0;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "voto";
      btn.setAttribute("data-opcion", o.id);
      btn.setAttribute("aria-describedby", "voto-estado");
      var cuenta = hay ? ((n || 0) + (total ? " · " + pct + " %" : "")) : "—";
      btn.innerHTML =
        '<div class="voto-top">' +
          '<span class="voto-label">' + o.emoji + " " + o.label + "</span>" +
          '<span class="voto-cuenta">' + cuenta + "</span>" +
        "</div>" +
        '<div class="barra" aria-hidden="true"><i style="width:' + (hay ? pct : 0) + '%"></i></div>';
      btn.addEventListener("click", function () { irAVotar(o); });
      host.appendChild(btn);
    });
  }

  function irAVotar(opcion) {
    var chat = $("chat");
    if (chat) chat.scrollIntoView({ behavior: "smooth", block: "start" });
    var estado = $("voto-estado");
    if (!estado) return;
    if (giscusListo()) {
      estado.className = "estado ok";
      estado.textContent = "Para registrar el voto «" + opcion.id.toUpperCase() +
        "», pulsa la reacción " + opcion.emoji +
        " en la barra de reacciones del debate, debajo. El recuento es público y el mismo para todo el mundo.";
    } else {
      estado.className = "estado";
      estado.innerHTML = "La votación pública aún no está activa en esta página. " +
        "Mientras tanto, deja tu respuesta (A, B o C) en un <a href=\"" + YT +
        "\" rel=\"noopener noreferrer\" target=\"_blank\">comentario del vídeo en YouTube</a>.";
    }
  }

  function mensajeConfiguracion() {
    return "El chat y la votación pública de esta página usan GitHub Discussions (giscus), un servicio gratuito. " +
      "Todavía no están activados en el repositorio: hace falta que Pedro active Discussions e instale la aplicación giscus, sin coste. " +
      "Hasta entonces, participa en los <a href=\"" + YT +
      "\" rel=\"noopener noreferrer\" target=\"_blank\">comentarios de YouTube</a>.";
  }

  function cargarGiscus() {
    var host = $("giscus-host");
    var estado = $("chat-estado");
    var votoEstado = $("voto-estado");
    if (!giscusListo()) {
      if (estado) estado.innerHTML = mensajeConfiguracion();
      if (votoEstado) {
        votoEstado.innerHTML = "La votación pública se activa cuando esté listo el chat de abajo. Mientras tanto, puedes dejar A, B o C en un <a href=\"" + YT + "\" rel=\"noopener noreferrer\" target=\"_blank\">comentario de YouTube</a>.";
      }
      return;
    }
    if (estado) {
      estado.className = "estado ok";
      estado.textContent = "Para votar, usa las reacciones del debate: 👍 es A, ❤️ es B y 🎉 es C. Los comentarios aparecen debajo. Se entra con GitHub.";
    }
    if (votoEstado) {
      votoEstado.className = "estado ok";
      votoEstado.textContent = "Pulsa una opción para ir al chat y votar con la reacción correspondiente. 👍 es A, ❤️ es B y 🎉 es C.";
    }
    var s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.setAttribute("data-repo", GISCUS.repo);
    s.setAttribute("data-repo-id", GISCUS.repoId);
    s.setAttribute("data-category", GISCUS.category);
    s.setAttribute("data-category-id", GISCUS.categoryId);
    s.setAttribute("data-mapping", GISCUS.mapping);
    s.setAttribute("data-term", GISCUS.term);
    s.setAttribute("data-strict", "0");
    s.setAttribute("data-reactions-enabled", GISCUS.reactionsEnabled);
    s.setAttribute("data-emit-metadata", GISCUS.emitMetadata);
    s.setAttribute("data-input-position", GISCUS.inputPosition);
    s.setAttribute("data-theme", GISCUS.theme);
    s.setAttribute("data-lang", GISCUS.lang);
    s.setAttribute("data-loading", "lazy");
    host.appendChild(s);
  }

  function escucharGiscus() {
    window.addEventListener("message", function (event) {
      if (event.origin !== "https://giscus.app") return;
      var data = event.data && event.data.giscus;
      if (!data) return;
      if (data.error) {
        var estado = $("chat-estado");
        if (estado) {
          estado.className = "estado";
          estado.innerHTML = "El chat de GitHub no ha podido cargarse. " +
            "Puedes comentar en el <a href=\"" + YT +
            "\" rel=\"noopener noreferrer\" target=\"_blank\">vídeo de YouTube</a>.";
        }
        return;
      }
      var disc = data.discussion;
      if (disc && disc.reactionCounts) pintarVotos(disc.reactionCounts);
    });
  }

  async function mostrarContadores() {
    var el = $("contadores");
    if (!el) return;
    var leer = async function (path) {
      try {
        var r = await fetch(GC + "/counter/" + encodeURIComponent(path) + ".json");
        if (!r.ok) return null;
        var j = await r.json();
        return j && j.count ? j.count : null;
      } catch (e) {
        return null;
      }
    };
    var pathsVisita = [PATH_VISITAS];
    if (esLive()) pathsVisita.push(location.pathname);
    var visitas = null;
    for (var i = 0; i < pathsVisita.length; i++) {
      visitas = await leer(pathsVisita[i]);
      if (visitas) break;
    }
    var uso = await leer(PATH_USO);
    el.textContent = "Visitas web: " + (visitas || "No disponible") +
      " · Uso de la app: " + (uso || "No disponible");
    if (!esLive()) el.textContent += " (en esta prueba no se envían visitas)";
  }

  pintarVotos(null);
  escucharGiscus();
  cargarGiscus();
  mostrarContadores();
})();

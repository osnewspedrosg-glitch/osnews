/* Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews) · programa propio.
   Charla local: las dos memorias alimentan el análisis, la respuesta se adapta
   y lo aprendido vuelve a las dos memorias. Sin red, sin claves, sin pagos. */
(function () {
  "use strict";

  if (!window.OSN_LORENA) {
    document.getElementById("result-text").textContent =
      "No se ha podido cargar lorena.js. Abre esta página desde el sitio de OSNews (/lorena/).";
    return;
  }

  var EMO_ORDER = ["alegria", "gratitud", "calma", "sorpresa", "tristeza", "soledad", "enfado", "miedo", "ansiedad"];
  var FOLLOW = {
    alegria: "Si quieres, cuéntame qué lo ha hecho posible.",
    gratitud: "Me alegra acompañarte. ¿Hay algo más que quieras compartir?",
    calma: "Cuando quieras, seguimos hablando.",
    sorpresa: "¿Qué es lo que más te ha sorprendido?",
    tristeza: [
      "Si te apetece, puedes contarme un poco más. Aquí estoy.",
      "Cuando quieras, me dices algo más. Te escucho.",
      "Si te viene bien, sigue cuando tú digas. Aquí estoy.",
      "No hay prisa. Si quieres ampliarlo, te leo."
    ],
    soledad: "No tienes que pasar por esto en silencio. Te escucho.",
    enfado: "¿Qué es lo que más te ha sentado mal?",
    miedo: "Vamos despacio. ¿Qué es lo que más te preocupa?",
    ansiedad: "No hay prisa. ¿Quieres poner en palabras lo que te agobia?"
  };
  var TREND = { mejora: "mejora", empeora: "empeora", estable: "estable" };

  var lo = OSN_LORENA.create({ app: "lorena", assistant: "MAY" });
  var form = document.getElementById("form");
  var input = document.getElementById("in");
  var log = document.getElementById("log");
  var crisis = document.getElementById("crisis");
  var diagram = document.querySelector(".diagram");
  var timers = [];

  lo.mount(document.getElementById("lorena-slot"), {
    buttonText: "Borrar memoria Lorena",
    noteText: "🔒 memoria emocional solo en este dispositivo · estimación orientativa por palabras",
    onForget: function () {
      renderMemories();
      renderAnalysis(null);
      document.getElementById("result-text").textContent =
        "He borrado las dos memorias en este dispositivo. Puedes empezar de nuevo cuando quieras.";
      document.getElementById("result-meta").textContent = "";
      crisis.hidden = true;
      log.innerHTML = "";
      clearPulse();
    }
  });

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function joinList(arr) {
    return arr && arr.length ? arr.join(", ") : "—";
  }
  function topicList(topics) {
    var keys = Object.keys(topics || {});
    if (!keys.length) return "—";
    keys.sort(function (a, b) { return (topics[b] || 0) - (topics[a] || 0); });
    return keys.slice(0, 8).join(", ");
  }
  function scoreList(toneScores) {
    var bits = [];
    Object.keys(toneScores || {}).forEach(function (emo) {
      Object.keys(toneScores[emo] || {}).forEach(function (tone) {
        var n = toneScores[emo][tone];
        if (n) bits.push(emo + " / " + tone + " (" + (n > 0 ? "+" : "") + n + ")");
      });
    });
    return bits.length ? bits.join(" · ") : "—";
  }

  function renderMemories() {
    var m = lo.memory();
    var u = m.user, a = m.assistant;
    $("u-turns").textContent = String(u.turns || 0);
    if (u.last) {
      var lab = u.last.label || ((OSN_LORENA.EMOTIONS[u.last.emotion || u.last.e] || {}).name) || "—";
      var inten = u.last.intensity != null ? u.last.intensity : u.last.i;
      $("u-last").textContent = lab + " " + inten + "/10";
    } else $("u-last").textContent = "—";
    $("u-topics").textContent = topicList(u.topics);
    $("u-prefs").textContent = joinList(u.prefs);
    $("a-replies").textContent = String(a.replies || 0);
    $("a-tone").textContent = a.lastTone || "—";
    $("a-scores").textContent = scoreList(a.toneScores);
    $("a-notes").textContent = (a.notes && a.notes.length) ? a.notes[a.notes.length - 1].txt : "—";
  }

  function renderAnalysis(a) {
    var list = $("emotions");
    list.innerHTML = "";
    var scores = (a && a.scores) || {};
    var max = 0;
    EMO_ORDER.forEach(function (k) { max = Math.max(max, scores[k] || 0); });
    EMO_ORDER.forEach(function (k) {
      var meta = OSN_LORENA.EMOTIONS[k];
      var li = el("li");
      if (a && a.emotion === k) li.className = "is-max";
      li.appendChild(el("span", "", (meta.emoji || "") + " " + meta.name));
      var bar = el("span", "bar"); var fill = el("i");
      fill.style.width = max > 0 ? Math.round(((scores[k] || 0) / max) * 100) + "%" : "0%";
      bar.appendChild(fill); li.appendChild(bar);
      li.appendChild(el("span", "", max > 0 ? String(Math.round((scores[k] || 0) * 10) / 10) : "0"));
      list.appendChild(li);
    });
    if (!a) {
      $("intensity").textContent = "— / 10";
      $("ibar-fill").style.width = "0%";
      $("trend").textContent = "—";
      $("trend").parentElement.removeAttribute("data-trend");
      return;
    }
    $("intensity").textContent = a.intensity + " / 10";
    $("ibar-fill").style.width = (a.intensity * 10) + "%";
    $("trend").textContent = TREND[a.trend] || a.trend || "—";
    $("trend").parentElement.setAttribute("data-trend", a.trend || "");
  }

  function clearPulse() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    ["box-ia", "box-user", "box-asst", "box-analyze", "box-result"].forEach(function (id) {
      $(id).classList.remove("active", "learn");
    });
    diagram.classList.remove("learning");
  }

  function pulse(step) {
    clearPulse();
    var seq = [
      [0, ["box-ia"]],
      [280, ["box-user", "box-asst"]],
      [720, ["box-analyze"]],
      [1180, ["box-result"]],
      [1600, []]
    ];
    seq.forEach(function (pair) {
      timers.push(setTimeout(function () {
        ["box-ia", "box-user", "box-asst", "box-analyze", "box-result"].forEach(function (id) {
          $(id).classList.remove("active");
        });
        pair[1].forEach(function (id) { $(id).classList.add("active"); });
        if (pair[0] === 1600) {
          diagram.classList.add("learning");
          $("box-user").classList.add("learn");
          $("box-asst").classList.add("learn");
        }
      }, pair[0]));
    });
  }

  function addBubble(who, text) {
    var b = el("div", "bubble " + who);
    b.appendChild(el("strong", "", who === "user" ? "Tú" : "MAY"));
    b.appendChild(document.createTextNode(text));
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  }

  function baseReply(a) {
    if (!a || !a.detected) {
      return "Cuando quieras, escribe cómo te sientes o lo que te ronda la cabeza. Te escucho.";
    }
    var f = FOLLOW[a.emotion];
    if (Array.isArray(f)) return f[(lo.memory().assistant.replies || 0) % f.length];
    return f || "Te escucho. ¿Quieres contar un poco más?";
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    addBubble("user", text);
    var out = lo.respond(text, function (a) { return baseReply(a); });
    addBubble("may", out.text);
    document.getElementById("result-text").textContent = out.text;
    var meta = "Tono: " + (out.tone || "—");
    if (out.analysis && out.analysis.detected) {
      meta += " · " + out.analysis.label + " " + out.analysis.intensity + "/10";
      if (out.analysis.secondary && out.analysis.secondary.label) {
        meta += " · " + out.analysis.secondary.label + " " + out.analysis.secondary.intensity + "/10";
      }
      meta += " · tendencia " + (TREND[out.analysis.trend] || out.analysis.trend);
    }
    if (out.modeLabel) meta += " · " + out.modeLabel;
    document.getElementById("result-meta").textContent = meta;
    renderAnalysis(out.analysis);
    renderMemories();
    pulse();
    if (out.note || (out.text && /\b(024|112)\b/.test(out.text))) {
      crisis.hidden = false;
      crisis.textContent = out.note || OSN_LORENA.CRISIS_NOTE;
    } else {
      crisis.hidden = true;
    }
  });

  input.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      form.requestSubmit();
    }
  });

  var GUIDE_KEY = "lorena-guia-opcional-v1";
  var LEVEL_NAME = {
    "sin señales claras": "Sin señales claras",
    "atención": "Atención",
    "cuidado": "Cuidado",
    "peligro": "Peligro"
  };
  function levelWord(n) {
    return n >= 3 ? "peligro" : n === 2 ? "cuidado" : n === 1 ? "atención" : "sin señales claras";
  }
  function renderGuide(g) {
    var out = $("guia-out");
    out.innerHTML = "";
    if (!g) return;
    var lvl = el("p", "guia-level level-" + (g.levelNum || 0));
    lvl.appendChild(el("strong", "", LEVEL_NAME[g.level] || g.level));
    out.appendChild(lvl);
    if (!g.categories.length) {
      out.appendChild(el("p", "guia-ok", "En estas frases no veo señales claras de control, desprecio u otras actitudes de riesgo. Eso no cierra nada: tú conoces el contexto. Si algo te inquieta, está bien pedirle una segunda mirada a alguien de confianza o al 016."));
    } else {
      out.appendChild(el("p", "guia-ok", "He leído las frases que has pegado. Estas son las actitudes que resaltan, con las palabras exactas que las han activado. No pongo etiqueta a ninguna persona."));
      g.categories.forEach(function (c) {
        var art = el("article", "guia-cat level-" + c.level);
        art.appendChild(el("h3", "", c.label + " · " + levelWord(c.level)));
        var ul = el("ul", "guia-quotes");
        (c.phrases || []).forEach(function (ph) {
          var li = el("li");
          li.appendChild(el("q", "", ph));
          ul.appendChild(li);
        });
        art.appendChild(ul);
        out.appendChild(art);
      });
    }
  }
  $("guia-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var text = ($("guia-in").value || "").trim();
    if (!text) {
      $("guia-out").textContent = "Cuando quieras, pega aquí los mensajes. Los leemos con calma, solo en este aparato.";
      return;
    }
    var g = OSN_LORENA.analyzeGuide(text);
    renderGuide(g);
    try {
      if ($("guia-guardar").checked) {
        localStorage.setItem(GUIDE_KEY, JSON.stringify({ t: Date.now(), text: text.slice(0, 8000), level: g.level }));
      } else {
        localStorage.removeItem(GUIDE_KEY);
      }
    } catch (e) {}
  });
  $("guia-salida").addEventListener("click", function () {
    try { lo.forget(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try { localStorage.removeItem(GUIDE_KEY); } catch (e) {}
    try { $("guia-in").value = ""; $("guia-out").innerHTML = ""; log.innerHTML = ""; } catch (e) {}
    try { history.replaceState(null, "", "https://www.aemet.es/"); } catch (e) {}
    location.replace("https://www.aemet.es/");
  });
  try {
    var saved = JSON.parse(localStorage.getItem(GUIDE_KEY) || "null");
    if (saved && saved.text) {
      $("guia-in").value = saved.text;
      $("guia-guardar").checked = true;
    }
  } catch (e) {}
  if (location.hash === "#guia-mujeres") {
    var gbox = $("guia-mujeres");
    if (gbox && gbox.scrollIntoView) gbox.scrollIntoView({ block: "start" });
  }

  // Barras a cero y memorias persistidas (si las hay) al abrir.
  renderAnalysis(null);
  renderMemories();
  var last = lo.memory().user.last;
  if (last) {
    renderAnalysis({
      emotion: last.emotion || last.e,
      intensity: last.intensity != null ? last.intensity : last.i,
      trend: "estable",
      scores: {},
      detected: true,
      label: last.label
    });
  }
})();

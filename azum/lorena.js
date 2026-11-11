/* ==========================================================================
   Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews) · LORENA_V1
   Bucle de inteligencia emocional para MAY, Eva, Azum y Asdrúbal:
     (1) Memoria del historial del usuario  ─┐
     (2) Memoria del asistente (MAY, etc.)  ─┴─► (3) analiza con inteligencia y
         medida de emociones ─► (4) respuesta con inteligencia emocional
         └─ retroalimentación (1): lo aprendido vuelve a las DOS memorias.
   Todo ocurre en este dispositivo (localStorage). No envía nada a ningún
   servidor, no usa APIs de pago ni claves. La emoción es una estimación
   orientativa por palabras, no una medición clínica ni un diagnóstico.
   Mismo archivo en: lorena.js · asdrubal/lorena.js · eva-osnews/lorena.js ·
   azum/lorena.js (un test comprueba que son idénticos).
   ========================================================================== */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OSN_LORENA = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var CREDIT = 'Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)';
  var MAX_EMO = 40, MAX_NOTES = 20, MAX_TOPICS = 30, MAX_PREFS = 12;

  /* ---------- Emociones ---------- */
  var EMOTIONS = {
    alegria:  { name: 'alegría',  valence: 1,  emoji: '😊' },
    gratitud: { name: 'gratitud', valence: 1,  emoji: '🙏' },
    calma:    { name: 'calma',    valence: 0,  emoji: '😌' },
    sorpresa: { name: 'sorpresa', valence: 0,  emoji: '😮' },
    tristeza: { name: 'tristeza', valence: -1, emoji: '😢' },
    soledad:  { name: 'soledad',  valence: -1, emoji: '🫂' },
    enfado:   { name: 'enfado',   valence: -1, emoji: '😠' },
    miedo:    { name: 'miedo',    valence: -1, emoji: '😨' },
    ansiedad: { name: 'ansiedad', valence: -1, emoji: '😰' }
  };

  /* Léxico español (texto sin tildes, en minúsculas). «*» = raíz. Peso 1-3. */
  var LEX = {
    alegria: [['feliz*', 3], ['alegr*', 3], ['content*', 2], ['genial', 2], ['estupend*', 2], ['maravill*', 2],
      ['ilusion*', 2], ['encant*', 2], ['guay', 2], ['fenomenal', 2], ['disfrut*', 2], ['emocionad*', 2],
      ['jaja*', 2], ['risa*', 1], ['divert*', 2], ['orgullos*', 2], ['que bien', 2], ['bien', 1], ['animad*', 2],
      ['buen dia', 1], ['estoy mejor', 2], ['me siento mejor', 2], ['me gusta', 1], ['perfecto', 1], ['fantastic*', 2], ['celebr*', 2]],
    gratitud: [['gracias', 2], ['agradec*', 3], ['te lo agradezco', 3], ['mil gracias', 3]],
    calma: [['tranquil*', 2], ['calma*', 2], ['relajad*', 2], ['seren*', 2], ['paz', 2], ['descansad*', 1],
      ['sosiego', 2], ['en calma', 2]],
    sorpresa: [['sorpres*', 2], ['increible', 1], ['alucin*', 2], ['no me lo creo', 2], ['que fuerte', 2], ['inesperad*', 2]],
    tristeza: [['trist*', 3], ['llor*', 3], ['deprimid*', 3], ['depresion', 3], ['desanimad*', 3], ['abatid*', 3],
      ['pena', 2], ['apenad*', 2], ['melancol*', 2], ['hundid*', 3], ['echo de menos', 2], ['duelo', 3],
      ['destrozad*', 3], ['desolad*', 3], ['decepcion*', 2], ['mal', 1], ['fatal', 2], ['vacio', 2],
      ['sin ganas', 2], ['desesper*', 3], ['infeliz', 3], ['dolid*', 2], ['me duele', 2], ['roto', 2], ['rota', 2]],
    soledad: [['soledad', 3], ['me siento solo', 3], ['me siento sola', 3], ['estoy solo', 2], ['estoy sola', 2],
      ['aislad*', 2], ['nadie me', 2], ['abandonad*', 2], ['sin nadie', 3], ['no tengo a nadie', 3]],
    enfado: [['enfad*', 3], ['cabread*', 3], ['furios*', 3], ['rabia', 3], ['ira', 3], ['harto', 2], ['harta', 2],
      ['indign*', 2], ['odio', 3], ['molest*', 2], ['irritad*', 2], ['mosque*', 2], ['estoy hasta', 2],
      ['injust*', 1], ['asco', 2], ['me revienta', 3], ['me cabrea', 3], ['quemad*', 1]],
    miedo: [['miedo', 3], ['asustad*', 3], ['terror', 3], ['aterr*', 3], ['panico', 3], ['temo', 2], ['temor', 2],
      ['susto', 2], ['peligro', 2], ['me da miedo', 3], ['inseguridad', 2], ['amenaz*', 2]],
    ansiedad: [['ansiedad', 3], ['ansios*', 3], ['agobi*', 3], ['estres*', 3], ['nervios*', 2], ['preocupad*', 2],
      ['preocupa*', 2], ['angusti*', 3], ['inquiet*', 2], ['no puedo dormir', 2], ['insomnio', 2], ['presion', 1],
      ['desbord*', 3], ['bloquead*', 2], ['no me da la vida', 2]]
  };
  var EMOJI = {
    alegria: /[😀😃😄😁😆😊🙂🥰😍🤩🥳❤💖💗🎉👏😂🤣]/u,
    tristeza: /[😢😭😞😔☹🙁💔😿]/u,
    enfado: /[😠😡🤬👿]/u,
    miedo: /[😨😱😧😦]/u,
    ansiedad: /[😰😟😥😬]/u,
    calma: /[😌🧘🌿]/u,
    sorpresa: /[😮😲😯🤯]/u,
    gratitud: /[🙏]/u
  };
  var INTENS = { muy: 1.5, mucho: 1.4, mucha: 1.4, muchisimo: 1.8, muchisima: 1.8, super: 1.5, demasiado: 1.6,
    tan: 1.3, totalmente: 1.6, completamente: 1.6, bastante: 1.2, increiblemente: 1.7, fatal: 1.3 };
  var NEG = { no: 1, nunca: 1, ni: 1, tampoco: 1, jamas: 1, nada: 1 };

  /* Señales de malestar fuerte: se añade una nota amable con 024 / 112. */
  var CRISIS = /(quiero morir|me quiero morir|quisiera morir|suicid|quitarme la vida|no quiero vivir|acabar con todo|acabar con mi vida|hacerme dano|autolesi|cortarme|mejor sin mi|desaparecer para siempre|no merece la pena vivir|no vale la pena vivir)/;
  var HIGH = /(no puedo mas|no aguanto mas|no lo soporto mas|todo me sale mal|no tengo salida|estoy al limite|me rindo)/;

  var STOPWORDS = ('que como para pero porque cuando donde quien cual este esta estos estas eso esto aquel muy mucho '
    + 'mucha tengo tiene tienes tener estoy estas esta estan estar hola gracias sobre entre desde hasta tambien todo '
    + 'toda todos todas algo nada siempre nunca ahora antes despues luego bien mal hace hacer hago puedo puede '
    + 'quiero quieres sabes saber dime cuentame quiero siento sentir siente soy eres somos ser sido fue era han has '
    + 'hay mas menos otro otra otros otras mismo misma cosa cosas solo sola poco poca pues vale bueno buena buenos '
    + 'buenas dias tarde noche usted ellos ellas nosotros vosotros mio mia tuyo tuya suyo suya creo parece verdad '
    + 'gusta encanta prefiero mejor peor').split(' ');
  var STOP = {};
  STOPWORDS.forEach(function (w) { STOP[w] = 1; });

  function fold(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function matchesWord(word, kw) {
    if (kw.charAt(kw.length - 1) === '*') return word.indexOf(kw.slice(0, -1)) === 0;
    return word === kw;
  }

  /* ---------- (3) Análisis: inteligencia y medida de emociones ---------- */
  function analyzeText(text, history, now) {
    var raw = String(text == null ? '' : text);
    var t = fold(raw);
    var words = t ? t.split(' ') : [];
    var scores = {};
    Object.keys(EMOTIONS).forEach(function (e) { scores[e] = 0; });
    var hits = [];

    Object.keys(LEX).forEach(function (emo) {
      LEX[emo].forEach(function (entry) {
        var kw = entry[0], w = entry[1];
        if (kw.indexOf(' ') >= 0) {
          var idx = (' ' + t + ' ').indexOf(' ' + kw + ' ');
          if (idx < 0) return;
          var before = t.slice(0, idx).trim().split(' ');
          var f = factor(before, before.length);
          scores[emo] += w * f.mult * (f.neg ? 0.2 : 1);
          if (f.neg && EMOTIONS[emo].valence > 0) scores.tristeza += w * 0.8 + 1;
          hits.push(kw);
          return;
        }
        for (var i = 0; i < words.length; i++) {
          if (!matchesWord(words[i], kw)) continue;
          var g = factor(words, i);
          if (g.neg) {
            scores[emo] += w * 0.15;
            if (EMOTIONS[emo].valence > 0) scores.tristeza += (w * 0.8 + 1) * g.mult;
          } else scores[emo] += w * g.mult;
          hits.push(words[i]);
        }
      });
    });
    Object.keys(EMOJI).forEach(function (emo) { if (EMOJI[emo].test(raw)) { scores[emo] += 2; hits.push(emo + ':emoji'); } });
    /* «estoy bien» genérico no debe ganar a una emoción fuerte */
    var top = null, best = 0;
    Object.keys(scores).forEach(function (e) { if (scores[e] > best + 1e-9) { best = scores[e]; top = e; } });

    var excl = (raw.match(/!/g) || []).length;
    var letters = raw.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
    var caps = letters.length >= 6 ? letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length / letters.length : 0;

    var distress = CRISIS.test(t) ? 'crisis' : (HIGH.test(t) ? 'alto' : null);
    if (distress && (!top || EMOTIONS[top].valence >= 0)) { top = 'tristeza'; best = Math.max(best, 4); }

    var detected = !!top && best >= 1;
    var intensity;
    if (detected) {
      intensity = Math.round(best * 1.6) + Math.min(2, excl) + (caps > 0.6 ? 1 : 0);
      if (distress === 'crisis') intensity = Math.max(intensity, 9);
      else if (distress === 'alto') intensity = Math.max(intensity, 7);
      intensity = clamp(intensity, 1, 10);
    } else { top = 'calma'; intensity = 2; }

    /* Tendencia: considera el historial reciente del usuario (memoria 1) */
    var H = Array.isArray(history) ? history : [];
    var ts = now || Date.now();
    var carried = false;
    var last = H.length ? H[H.length - 1] : null;
    if (!detected && last && EMOTIONS[last.e] && EMOTIONS[last.e].valence < 0 && last.i >= 5 && ts - (last.t || 0) < 15 * 60000) {
      top = last.e; intensity = Math.max(2, last.i - 2); carried = true;
    }
    var v = EMOTIONS[top].valence * intensity;
    var recent = H.slice(-3).map(function (x) { return x.v || 0; });
    var trend = 'estable';
    if (recent.length) {
      var avg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
      if (v - avg >= 2) trend = 'mejora'; else if (avg - v >= 2) trend = 'empeora';
    }
    var lowRun = H.slice(-3).filter(function (x) { return (x.v || 0) <= -6; }).length;
    if (!distress && /^(tristeza|soledad|ansiedad|miedo)$/.test(top) && intensity >= 8 && lowRun >= 2) distress = 'alto';

    return {
      emotion: top, label: EMOTIONS[top].name, emoji: EMOTIONS[top].emoji, valence: EMOTIONS[top].valence,
      intensity: intensity, score: v, detected: detected || carried, carried: carried, trend: trend,
      previous: last ? last.e : null, distress: distress, hits: hits.slice(0, 12), scores: scores
    };
  }
  function factor(words, i) {
    var mult = 1, neg = false;
    for (var k = Math.max(0, i - 3); k < i; k++) {
      var w = words[k];
      if (INTENS[w]) mult = Math.max(mult, INTENS[w]);
      if (NEG[w] && i - k <= 3) neg = true;
    }
    return { mult: mult, neg: neg };
  }

  /* ---------- Tonos de respuesta ---------- */
  var TONES_FOR = {
    alegria: ['celebracion', 'curiosidad'], gratitud: ['gratitud'], calma: ['curiosidad'], sorpresa: ['curiosidad'],
    tristeza: ['validacion', 'animo'], soledad: ['validacion', 'animo'], enfado: ['calma', 'validacion'],
    miedo: ['calma', 'validacion'], ansiedad: ['calma', 'validacion']
  };
  var OPEN = {
    validacion: ['Gracias por contármelo{n}. Es normal sentir {emo}; lo que sientes importa.',
      'Te leo{n}, y entiendo que sientas {emo}. Es válido sentirse así.'],
    animo: ['Ánimo{n}: paso a paso, esto también puede ir aliviándose. Aquí estoy.',
      'Estoy contigo{n}. Un paso pequeño hoy ya cuenta; no tienes que poder con todo.'],
    calma: ['Vamos con calma{n}: respira despacio, sin prisa. Te escucho.',
      'Despacio{n}, respira hondo un momento. Vamos a verlo con calma.'],
    celebracion: ['¡Qué bien leerte así{n}! Me alegra mucho.', '¡Qué alegría{n}! Eso merece celebrarse.'],
    gratitud: ['Gracias a ti{n}, de corazón.', 'Gracias a ti{n}; me alegra poder acompañarte.'],
    curiosidad: ['']
  };
  var CRISIS_NOTE = 'Si estás pasando por un momento muy difícil, no lo lleves en soledad: habla con alguien de confianza o con un profesional. En España puedes llamar gratis al 024 (atención a la conducta suicida, 24 h) y, si hay peligro inmediato, al 112.';
  var HIGH_NOTE = 'Si te ayuda, cuéntaselo también a alguien de confianza o a un profesional. En España, el 024 atiende gratis las 24 h y el 112 en emergencias.';

  function emptyUser() {
    return { v: 1, turns: 0, emo: [], topics: {}, prefs: [], firstSeen: null, lastSeen: null, last: null };
  }
  function emptyAssistant() {
    return { v: 1, toneScores: {}, notes: [], pending: null, replies: 0, lastTone: null };
  }
  function safeParse(s, fallback) {
    try { var o = JSON.parse(s); return o && typeof o === 'object' ? o : fallback; } catch (e) { return fallback; }
  }
  function memStorage() {
    var d = {};
    return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
      setItem: function (k, v) { d[k] = String(v); }, removeItem: function (k) { delete d[k]; } };
  }
  function pickVariant(arr, seed) { return arr[Math.abs(seed) % arr.length]; }

  function topicsOf(text) {
    var out = [];
    fold(text).split(' ').forEach(function (w) {
      if (w.length < 5 || STOP[w] || /^\d+$/.test(w)) return;
      for (var e in LEX) for (var j = 0; j < LEX[e].length; j++) if (matchesWord(w, LEX[e][j][0])) return;
      if (out.indexOf(w) < 0) out.push(w);
    });
    return out.slice(0, 6);
  }
  function prefsOf(text) {
    var m = String(text).match(/\b(?:me gusta(?:n)?|me encanta(?:n)?|prefiero|disfruto con)\s+([^.,;!?¿¡\n]{2,40})/i);
    return m ? m[1].trim().toLowerCase() : null;
  }

  /* ---------- Instancia por app ---------- */
  function create(opts) {
    opts = opts || {};
    var app = String(opts.app || 'app').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'app';
    var assistant = opts.assistant || 'MAY';
    var storage = opts.storage || (typeof localStorage !== 'undefined' ? safeLocal() : null) || memStorage();
    var now = typeof opts.now === 'function' ? opts.now : function () { return Date.now(); };
    var userName = typeof opts.userName === 'function' ? opts.userName : function () { return null; };
    var KU = 'lorena-' + app + '-usuario-v1', KA = 'lorena-' + app + '-asistente-v1';
    var listeners = [];

    function safeLocal() { try { var k = '__lorena_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (e) { return null; } }
    function loadUser() { var u = safeParse(storage.getItem(KU), null); return u ? Object.assign(emptyUser(), u) : emptyUser(); }
    function loadAsst() { var a = safeParse(storage.getItem(KA), null); return a ? Object.assign(emptyAssistant(), a) : emptyAssistant(); }
    function saveBoth(u, a) {
      try { storage.setItem(KU, JSON.stringify(u)); storage.setItem(KA, JSON.stringify(a)); return true; } catch (e) { return false; }
    }

    function analyze(text) { return analyzeText(text, loadUser().emo, now()); }

    function chooseTone(analysis, asst) {
      var cands = TONES_FOR[analysis.emotion] || ['curiosidad'];
      var sc = (asst || loadAsst()).toneScores[analysis.emotion] || {};
      var best = cands[0];
      cands.forEach(function (c) { if ((sc[c] || 0) > (sc[best] || 0)) best = c; });
      return best;
    }

    /* (4) Respuesta con inteligencia emocional: combina con la respuesta de la app */
    function shape(base, analysis, o) {
      o = o || {};
      base = String(base == null ? '' : base);
      var a = analysis || analyze(o.text || '');
      var asst = loadAsst();
      var tone = chooseTone(a, asst);
      var lang = o.lang || 'es';
      var already = /\b(024|112|016)\b/.test(base);
      /* si la respuesta de la app ya valida la emoción, no se repite la apertura */
      var empathic = /(lo que sientes (es valido|importa)|te leo y noto|parece que sientes|noto (que )?(tristeza|miedo|ansiedad|enfado|rabia|soledad)|siento (mucho|muchisimo) que|es valido sentir|respira (hondo|despacio)|se nota tu alegria|leerte asi)/.test(fold(base));
      var opening = '';
      var neg = a.valence < 0;
      var better = a.detected && !a.carried && a.trend === 'mejora' && a.previous && EMOTIONS[a.previous] && EMOTIONS[a.previous].valence < 0 && a.valence >= 0;
      if (lang === 'es' && !o.noOpening && a.detected && !a.carried && !already && !empathic && (neg ? a.intensity >= 3 : (a.intensity >= 5 || better))) {
        var n = userName(); n = n ? ', ' + String(n).slice(0, 30) : '';
        var arr = OPEN[tone] || [''];
        opening = pickVariant(arr, asst.replies + a.intensity).replace('{n}', n).replace('{emo}', a.label);
        if (a.distress === 'crisis') opening = 'Siento mucho que estés pasando por esto' + n + '. Lo que sientes importa.';
      }
      if (lang === 'es' && better && !o.noOpening && !already) {
        opening = (opening ? opening + ' ' : '') + 'Noto que estás algo mejor que antes, y me alegra.';
      }
      if (opening && base && fold(base).indexOf(fold(opening).slice(0, 18)) === 0) opening = '';
      var note = '';
      if (a.distress === 'alto' && /profesional/.test(fold(base))) note = '';
      else if (a.distress && !already) note = a.distress === 'crisis' ? CRISIS_NOTE : HIGH_NOTE;
      var text = [[opening, base].filter(Boolean).join(' '), note].filter(Boolean).join('\n');
      return { text: text.trim(), tone: tone, opening: opening, note: note, analysis: a };
    }

    /* Retroalimentación (1): actualiza las DOS memorias tras cada respuesta */
    function learn(userText, reply, analysis, tone) {
      var u = loadUser(), asst = loadAsst();
      var a = analysis || analyzeText(userText, u.emo, now());
      var ts = now();
      if (asst.pending && EMOTIONS[asst.pending.e]) {
        var delta = a.score - asst.pending.v;
        var pe = asst.pending.e, pt = asst.pending.tone;
        var worked = delta >= 1 || (a.valence > 0 && asst.pending.v >= 0);
        var failed = delta <= -2;
        if (worked || failed) {
          var sc = asst.toneScores[pe] || (asst.toneScores[pe] = {});
          sc[pt] = clamp((sc[pt] || 0) + (worked ? 1 : -1), -5, 5);
          asst.notes.push({ t: ts, e: pe, tone: pt, ok: !!worked,
            txt: 'Tono «' + pt + '» con ' + EMOTIONS[pe].name + ': ' + (worked ? 'ayudó' : 'no ayudó') });
          asst.notes = asst.notes.slice(-MAX_NOTES);
        }
      }
      u.turns += 1;
      if (!u.firstSeen) u.firstSeen = ts;
      u.lastSeen = ts;
      u.emo.push({ e: a.emotion, i: a.intensity, v: a.score, t: ts });
      u.emo = u.emo.slice(-MAX_EMO);
      topicsOf(userText).forEach(function (w) { u.topics[w] = (u.topics[w] || 0) + 1; });
      var keys = Object.keys(u.topics).sort(function (x, y) { return u.topics[y] - u.topics[x]; }).slice(0, MAX_TOPICS);
      var kept = {}; keys.forEach(function (k) { kept[k] = u.topics[k]; }); u.topics = kept;
      var p = prefsOf(userText);
      if (p && u.prefs.indexOf(p) < 0) { u.prefs.push(p); u.prefs = u.prefs.slice(-MAX_PREFS); }
      u.last = { e: a.emotion, label: a.label, i: a.intensity, trend: a.trend, distress: a.distress, t: ts };
      asst.replies += 1;
      asst.lastTone = tone || chooseTone(a, asst);
      asst.pending = { e: a.emotion, v: a.score, tone: asst.lastTone, t: ts };
      saveBoth(u, asst);
      listeners.forEach(function (fn) { try { fn(a); } catch (e) {} });
      return { user: u, assistant: asst };
    }

    /* Bucle completo: analizar → responder → aprender */
    function respond(userText, base, o) {
      o = o || {};
      var a = analyze(userText);
      var b = typeof base === 'function' ? base(a) : base;
      var s = shape(b, a, o);
      learn(userText, s.text, a, s.tone);
      return s;
    }

    function memory() { return { user: loadUser(), assistant: loadAsst() }; }
    function forget() {
      try { storage.removeItem(KU); storage.removeItem(KA); } catch (e) {}
      listeners.forEach(function (fn) { try { fn(null); } catch (e) {} });
    }
    function indicatorText(a) {
      var l = a || loadUser().last;
      if (!l) return 'Módulo Lorena · emoción detectada: —';
      var name = l.label || (EMOTIONS[l.emotion || l.e] || EMOTIONS.calma).name;
      var i = l.intensity != null ? l.intensity : l.i;
      return 'Módulo Lorena · emoción detectada: ' + name + ' ' + i + '/10';
    }

    /* Indicador visible + botón «Borrar memoria» */
    function mount(container, mo) {
      mo = mo || {};
      if (!container || typeof document === 'undefined') return null;
      var box = document.createElement('div');
      box.className = 'lorena-box';
      box.setAttribute('data-lorena', app);
      box.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12.5px;opacity:.95;margin:6px 0';
      var txt = document.createElement('span');
      txt.className = 'lorena-indicator';
      txt.setAttribute('aria-live', 'polite');
      txt.title = 'Estimación orientativa por palabras, hecha en este dispositivo. No es una medición clínica. ' + CREDIT;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lorena-forget ' + (mo.buttonClass || '');
      btn.textContent = mo.buttonText || '🧹 Borrar memoria';
      btn.style.cssText = 'background:none;border:1px solid currentColor;color:inherit;border-radius:8px;padding:2px 8px;cursor:pointer;font:inherit';
      var info = document.createElement('small');
      info.className = 'lorena-note';
      info.textContent = mo.noteText || '🔒 memoria emocional solo en este dispositivo · estimación orientativa por palabras';
      info.style.opacity = '.75';
      box.appendChild(txt); box.appendChild(btn); box.appendChild(info);
      container.appendChild(box);
      function paint(a) { txt.textContent = indicatorText(a || undefined); }
      paint();
      listeners.push(paint);
      btn.addEventListener('click', function () { forget(); if (typeof mo.onForget === 'function') mo.onForget(); });
      return box;
    }

    return { app: app, assistant: assistant, keys: { user: KU, assistant: KA }, analyze: analyze, shape: shape,
      learn: learn, respond: respond, memory: memory, forget: forget, indicatorText: indicatorText, mount: mount,
      chooseTone: function (a) { return chooseTone(a); }, onChange: function (fn) { listeners.push(fn); } };
  }

  return { VERSION: VERSION, CREDIT: CREDIT, EMOTIONS: EMOTIONS, create: create, analyzeText: analyzeText,
    fold: fold, CRISIS_NOTE: CRISIS_NOTE, HIGH_NOTE: HIGH_NOTE };
});

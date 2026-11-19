/* MAY AI OS — app web estática. Datos cifrados en este navegador. Sin servidor. */
"use strict";

const LS_KEY = "may-ai-os-web-v1";
const HOST_LIVE = "osnewspedrosg-glitch.github.io";
const PATH_VISITAS = "/osnews/may-ai-os/web/";
const PATH_USO = "/osnews/may-ai-os/web/uso";
const GC = "https://osnews-may.goatcounter.com";

const RUEDA = {
  "alegría": ["serenidad", "alegría", "éxtasis"],
  "confianza": ["aceptación", "confianza", "admiración"],
  "miedo": ["inquietud", "miedo", "terror"],
  "sorpresa": ["distracción", "sorpresa", "asombro"],
  "tristeza": ["melancolía", "tristeza", "pena profunda"],
  "aversión": ["aburrimiento", "aversión", "asco"],
  "ira": ["molestia", "enfado", "furia"],
  "anticipación": ["interés", "anticipación", "vigilancia"]
};
const NEGATIVAS = new Set(["miedo", "tristeza", "aversión", "ira"]);
const SUST_NC = ["alcohol", "tabaco", "cannabis", "cocaína", "otras"];
const PANEL12 = ["alcohol","cocaína","cannabis","heroína/opiáceos","fentanilo","metadona","anfetaminas","MDMA","metanfetamina","benzodiacepinas","ketamina","cannabinoides sintéticos"];
const TIPOS_PRUEBA = ["orina","saliva","sangre","parche de sudor","alcoholímetro","otro"];
const PREGUNTAS_MAY = [
  "¿Has apagado el fuego/la cocina?",
  "¿Has tomado la medicación del azúcar?",
  "¿Has cerrado la puerta con llave?",
  "¿Has bebido agua?",
  "¿Has cerrado el grifo?",
  "¿Has tomado la pastilla de la tensión?"
];
const AVISO = "Orientativo, consulta a tu médico.";
const AVISO_DETECTOR = "El parche detector es un concepto; hoy no existe. Un positivo debe confirmarlo un médico; algunos medicamentos pueden dar un falso positivo.";
const AVISO_ID = "Sin un servidor, la identidad del profesional no está verificada de forma criptográfica. Una versión futura con el servicio de salud podría añadir firma digital.";

let pin = null, salt = null, mem = null, ccaaDatos = null;
let vista = "inicio", emocionSel = null, nivelSel = 2;
let juego = null, lastEmoHtml = "";

function vacia() {
  return {
    usuario: "",
    bot: { nombre: "", enlace: "" },
    bot_apoyo: { nombre: "", enlace: "" },
    notas: [],
    habitos: [],
    emociones: [],
    conversacion: [],
    familia: [],
    juegos: [],
    automatizaciones: [],
    modo_mayores: false,
    mayores_checks: [],
    no_consumo: [],
    red_apoyo: {
      medico: { nombre: "", telefono: "", email: "", whatsapp: "" },
      centro: { nombre: "", telefono: "", email: "", whatsapp: "" },
      familia_contactos: [],
      ccaa: ""
    },
    pruebas_sustancias: [],
    profesional_acceso: {}
  };
}

function $(id) { return document.getElementById(id); }
function hoy() { return new Date().toISOString().slice(0, 10); }
function ahora() { return new Date().toISOString().slice(0, 16); }
function uid() { return Math.random().toString(16).slice(2, 12); }
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function nl(s) { return esc(s).replace(/\n/g, "<br>"); }

async function persistir() {
  if (!pin || !mem) return;
  const paquete = await MAY_CRYPTO.cifrar(pin, mem, salt);
  salt = MAY_CRYPTO.unb64(paquete.salt);
  localStorage.setItem(LS_KEY, JSON.stringify(paquete));
}

async function crearCuenta(nombre, nuevoPin, botNombre, botEnlace) {
  pin = nuevoPin;
  mem = vacia();
  mem.usuario = nombre;
  mem.bot = { nombre: botNombre || "", enlace: botEnlace || "" };
  const paquete = await MAY_CRYPTO.cifrar(pin, mem);
  salt = MAY_CRYPTO.unb64(paquete.salt);
  localStorage.setItem(LS_KEY, JSON.stringify(paquete));
}

async function desbloquear(intento) {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) throw new Error("no hay memoria");
  const paquete = JSON.parse(raw);
  const r = await MAY_CRYPTO.descifrar(intento, paquete);
  pin = intento;
  salt = r.salt;
  mem = Object.assign(vacia(), r.datos);
  mem.bot = Object.assign({ nombre: "", enlace: "" }, mem.bot);
  mem.bot_apoyo = Object.assign({ nombre: "", enlace: "" }, mem.bot_apoyo);
  mem.red_apoyo = Object.assign(vacia().red_apoyo, mem.red_apoyo);
  ["notas","habitos","emociones","familia","juegos","automatizaciones","mayores_checks","no_consumo","pruebas_sustancias"].forEach((k) => {
    if (!Array.isArray(mem[k])) mem[k] = [];
  });
}

function hayMemoria() { return !!localStorage.getItem(LS_KEY); }

/* —— contadores anónimos (solo en Pages, nunca en local) —— */
function esLive() { return location.hostname === HOST_LIVE; }
function contarUso() {
  if (!esLive() || !window.goatcounter || typeof window.goatcounter.count !== "function") return;
  try { window.goatcounter.count({ path: PATH_USO, title: "Uso MAY AI OS", event: true }); } catch (e) {}
}
async function mostrarContadores() {
  const el = $("contadores");
  if (!el) return;
  const vis = "Visitas web: No disponible";
  const uso = "Uso de la app: No disponible";
  const leer = async (path) => {
    try {
      const r = await fetch(GC + "/counter/" + encodeURIComponent(path) + ".json");
      if (!r.ok) return null;
      const j = await r.json();
      return j && j.count ? j.count : null;
    } catch (e) { return null; }
  };
  const [v, u] = await Promise.all([leer(PATH_VISITAS), leer(PATH_USO)]);
  el.textContent = "Visitas web: " + (v || "No disponible") + " · Uso de la app: " + (u || "No disponible");
  if (!esLive()) el.textContent += " (en esta prueba no se envían visitas)";
}
function inyectarGoat() {
  if (!esLive()) return;
  window.goatcounter = { no_onload: false };
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.setAttribute("data-goatcounter", GC + "/count");
  document.head.appendChild(s);
}

/* —— no consumo / detector helpers —— */
function diasLimpio(h) {
  const today = new Date(hoy());
  let base = h.inicio || hoy();
  try { base = h.inicio.slice(0, 10); } catch (e) { base = hoy(); }
  let d0 = new Date(base);
  for (const c of h.historial || []) {
    if (c.consumio) {
      const d = new Date(String(c.fecha).slice(0, 10));
      if (!isNaN(d) && d >= d0) d0 = new Date(d.getTime() + 86400000);
    }
  }
  return Math.max(0, Math.round((today - d0) / 86400000));
}

function botonesAyuda(extra) {
  const fam = (mem.red_apoyo.familia_contactos || [])[0];
  const cen = mem.red_apoyo.centro || {};
  let html = `<div class="ayuda"><p>${nl(extra || "Si lo necesitas, puedes pedir ayuda ahora.")}</p><p>`;
  if (fam && fam.telefono) html += `<a class="tel" href="tel:${esc(fam.telefono.replace(/\s/g,""))}">Llamar a mi familia</a>`;
  if (cen.telefono) html += `<a class="tel" href="tel:${esc(cen.telefono.replace(/\s/g,""))}">Llamar a mi centro</a>`;
  html += `<a class="tel" href="tel:024">Llamar al 024</a><a class="tel emer" href="tel:112">Llamar al 112</a></p><p class="muted">${esc(AVISO)}</p></div>`;
  return html;
}

function resumenTexto(incluirPruebas) {
  const nombre = mem.usuario || "la persona usuaria";
  const lineas = [
    "Resumen de MAY AI OS para " + nombre + ".",
    "Lo envía la propia persona; MAY no lo manda en segundo plano.",
    ""
  ];
  const ncs = (mem.no_consumo || []).filter((h) => !h.archivado);
  if (ncs.length) {
    lineas.push("No consumo:");
    for (const h of ncs) {
      const n = h.personalizado || h.sustancia;
      lineas.push("- " + n + ": " + diasLimpio(h) + " días en limpio (inicio " + (h.inicio || "") + ")");
      const rec = (h.historial || []).slice(-5);
      for (const c of rec) {
        lineas.push("  " + c.fecha + ": " + (c.consumio ? "consumo anotado" : "en limpio") + ", antojo " + (c.antojo ?? "?") + "/10");
      }
    }
  }
  const emos = (mem.emociones || []).slice(-8);
  if (emos.length) {
    lineas.push("", "Emociones recientes:");
    for (const e of emos) lineas.push("- " + e.fecha + ": " + (e.nombre || e.emocion) + " (" + e.intensidad + ")");
  }
  if (incluirPruebas) {
    const ps = (mem.pruebas_sustancias || []).filter((p) => !p.ocultar_en_resumen);
    lineas.push("", "Pruebas de sustancias (el parche detector es un concepto; hoy no existe):");
    if (!ps.length) lineas.push("No hay entradas visibles.");
    for (const p of ps.slice(-8)) {
      let eti = p.origen === "profesional" ? "profesional" : p.origen === "autotest-casero" ? "autotest casero (no profesional)" : "formato sensor futuro (concepto)";
      const pr = p.profesional || {};
      if (p.origen === "profesional") eti += " · " + [pr.nombre, pr.centro].filter(Boolean).join(", ");
      const pos = Object.entries(p.resultados || {}).filter(([, v]) => v === "positivo").map(([s]) => s);
      const neg = Object.entries(p.resultados || {}).filter(([, v]) => v === "negativo").map(([s]) => s);
      lineas.push("- " + p.fecha + " " + p.tipo + " (" + eti + ")");
      if (pos.length) lineas.push("  positivos (pendientes de confirmación médica): " + pos.join(", "));
      if (neg.length) lineas.push("  negativos: " + neg.join(", "));
    }
    lineas.push(AVISO_DETECTOR);
  }
  lineas.push("", AVISO, "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok");
  return lineas.join("\n");
}

/* —— vistas —— */
function pintarAcceso() {
  $("nav").classList.add("hide");
  $("vista-principal").hidden = true;
  const box = $("vista-acceso");
  box.hidden = false;
  if (hayMemoria()) {
    box.innerHTML = `<h2>Hola de nuevo</h2>
      <p>Tu memoria está cifrada en este navegador. El PIN no se guarda.</p>
      <label for="pin">PIN de tu memoria</label>
      <input id="pin" type="password" autocomplete="current-password" minlength="4">
      <p class="err hide" id="err-pin">PIN incorrecto. Los datos no se han tocado.</p>
      <p><button type="button" id="btn-entrar">Entrar</button></p>`;
    $("btn-entrar").onclick = entrar;
    $("pin").onkeydown = (e) => { if (e.key === "Enter") entrar(); };
    $("pin").focus();
  } else {
    box.innerHTML = `<h2>Bienvenida o bienvenido</h2>
      <p>Soy MAY. La primera vez eliges tu nombre y un PIN. Toda la memoria se queda en este aparato, cifrada. Si olvidas el PIN, no se podrá leer.</p>
      <label for="nombre">¿Cómo te llamas?</label>
      <input id="nombre" autocomplete="nickname">
      <label for="pin1">Elige un PIN (mínimo 4 caracteres)</label>
      <input id="pin1" type="password" autocomplete="new-password" minlength="4">
      <label for="pin2">Repite el PIN</label>
      <input id="pin2" type="password" autocomplete="new-password" minlength="4">
      <label for="bot-n">¿Cómo se llama tu bot personal? (opcional)</label>
      <input id="bot-n">
      <label for="bot-e">Enlace de tu bot (opcional)</label>
      <input id="bot-e" type="url" placeholder="https://">
      <p class="err hide" id="err-alta"></p>
      <p><button type="button" id="btn-crear">Empezar</button></p>
      <p class="muted">${esc(AVISO)}</p>`;
    $("btn-crear").onclick = alta;
  }
}

async function alta() {
  const nombre = $("nombre").value.trim() || "amigo";
  const a = $("pin1").value, b = $("pin2").value;
  const err = $("err-alta");
  if (a.length < 4) { err.textContent = "El PIN tiene que tener al menos 4 caracteres."; err.classList.remove("hide"); return; }
  if (a !== b) { err.textContent = "Los PIN no coinciden. No se ha creado la memoria."; err.classList.remove("hide"); return; }
  await crearCuenta(nombre, a, $("bot-n").value.trim(), $("bot-e").value.trim());
  contarUso();
  mostrarApp();
}

async function entrar() {
  const err = $("err-pin");
  err.classList.add("hide");
  try {
    await desbloquear($("pin").value);
  } catch (e) {
    err.classList.remove("hide");
    return;
  }
  contarUso();
  mostrarApp();
}

function mostrarApp() {
  $("vista-acceso").hidden = true;
  $("vista-principal").hidden = false;
  $("nav").classList.remove("hide");
  ir(vista || "inicio");
}

function ir(nombre) {
  vista = nombre;
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.getAttribute("data-ir") === nombre));
  pintar();
}

function pintar() {
  const root = $("vista-principal");
  if (!mem) return;
  if (vista === "inicio") root.innerHTML = vistaInicio();
  else if (vista === "emociones") root.innerHTML = vistaEmociones();
  else if (vista === "consumo") root.innerHTML = vistaConsumo();
  else if (vista === "apoyo") root.innerHTML = vistaApoyo();
  else if (vista === "mas") root.innerHTML = vistaMas();
  enlazar();
}

function recordatorioInicio() {
  const partes = [];
  const limite = Date.now() - 24 * 3600 * 1000;
  const recents = (mem.emociones || []).filter((e) => {
    const t = Date.parse(e.fecha);
    return !isNaN(t) && t >= limite;
  });
  const neg = recents.filter((e) => NEGATIVAS.has(e.emocion));
  const alta = neg.filter((e) => e.intensidad >= 3);
  if (neg.length >= Math.max(1, Math.ceil(recents.length / 2)) || alta.length) {
    const nombres = neg.slice(-3).map((e) => e.nombre || e.emocion).join(", ");
    partes.push("Hoy te quiero acompañar con calma: en las últimas horas anotaste " + nombres + ". Estoy aquí contigo, sin prisa.");
    if (recents.some((e) => e.intensidad === 3 && (e.emocion === "tristeza" || e.emocion === "miedo"))) {
      partes.push("HELP");
    }
  }
  const hoyIso = hoy();
  for (const h of mem.no_consumo || []) {
    for (const c of h.historial || []) {
      if (String(c.fecha).slice(0,10) !== hoyIso) continue;
      const n = h.personalizado || h.sustancia;
      if (c.consumio) partes.push("Hoy anotaste un consumo de «" + n + "». No te juzgo; si quieres, lo vemos con calma.");
      else if ((c.antojo || 0) >= 8) { partes.push("Hoy el antojo de «" + n + "» está alto. Estoy aquí."); partes.push("HELP"); }
    }
  }
  return partes;
}

function vistaInicio() {
  const rec = recordatorioInicio();
  let html = `<section class="card"><h2>Hola ${esc(mem.usuario)}, ¿qué necesitas?</h2>`;
  for (const p of rec) {
    if (p === "HELP") html += botonesAyuda(MAY_AI.AVISO_AYUDA);
    else html += `<p>${esc(p)}</p>`;
  }
  html += `<p class="muted">${esc(AVISO)}</p></section>`;
  html += `<section class="card"><h2>Panel</h2>`;
  const habitosHoy = (mem.habitos || []).filter((h) => h.fecha === hoy());
  html += `<p><strong>Hábitos de hoy:</strong> ${habitosHoy.length ? habitosHoy.map((h) => esc(h.habito)).join(", ") : "todavía ninguno."}</p>`;
  const ncs = (mem.no_consumo || []).filter((h) => !h.archivado);
  if (ncs.length) {
    html += "<p><strong>No consumo:</strong></p><ul class='lista'>";
    for (const h of ncs) html += `<li>${esc(h.personalizado || h.sustancia)}: <span class="dias" style="font-size:1.2rem">${diasLimpio(h)}</span> días en limpio</li>`;
    html += "</ul>";
  }
  const emos = (mem.emociones || []).slice(-5);
  html += `<p><strong>Últimas emociones:</strong> ${emos.length ? "" : "todavía ninguna."}</p>`;
  if (emos.length) {
    html += "<ul class='lista'>";
    for (const e of emos) html += `<li>${esc(e.fecha)}: ${esc(e.nombre)} (${esc(e.emocion)} ${e.intensidad})</li>`;
    html += "</ul>";
  }
  html += `<p>Notas guardadas: ${mem.notas.length}. Pruebas visibles: ${(mem.pruebas_sustancias||[]).filter(p=>!p.ocultar_en_resumen).length}.</p>`;
  if (mem.modo_mayores) {
    const pend = (mem.mayores_checks || []).filter((c) => pendienteMayor(c));
    if (pend.length) html += `<p>Comprobaciones de mayores pendientes: ${pend.length}.</p>`;
  }
  html += `<p class="muted">Tu memoria está solo en este aparato, cifrada. El bot no la ve.</p></section>`;
  return html;
}

function vistaEmociones() {
  let html = `<section class="card"><h2>Rueda de emociones</h2>
    <p class="muted">Elige una emoción y una intensidad (1-3). MAY te responde con una técnica de su base de conocimiento.</p>
    <div class="rueda">`;
  for (const emo of Object.keys(RUEDA)) {
    html += `<button type="button" class="emo ${emocionSel===emo?"on":""}" data-emo="${esc(emo)}">${esc(emo)}</button>`;
  }
  html += `</div><div class="niveles">`;
  for (let i = 1; i <= 3; i++) {
    const n = emocionSel ? RUEDA[emocionSel][i-1] : "intensidad " + i;
    html += `<button type="button" class="niv ${nivelSel===i?"on":""}" data-n="${i}">${i}. ${esc(n)}</button>`;
  }
  html += `</div><p><button type="button" id="btn-siento">Anotar</button></p>
    <div id="resp-emo">${lastEmoHtml||""}</div></section>`;
  const his = (mem.emociones || []).slice(-12).reverse();
  html += `<section class="card"><h2>Historial</h2>`;
  if (!his.length) html += "<p>Aún no hay emociones anotadas.</p>";
  else {
    html += "<ul class='lista'>";
    for (const e of his) html += `<li>${esc(e.fecha)}: ${esc(e.nombre)} (${esc(e.emocion)} ${e.intensidad})</li>`;
    html += "</ul>";
  }
  html += "</section>";
  return html;
}

function vistaConsumo() {
  let html = `<section class="card"><h2>Hábitos de hoy</h2>
    <label for="habito-txt">Anotar un hábito</label>
    <input id="habito-txt" placeholder="por ejemplo, pasear 20 minutos">
    <p><button type="button" id="btn-habito">Apuntar</button></p>
    <ul class="lista">`;
  const hs = (mem.habitos || []).slice(-15).reverse();
  if (!hs.length) html += "<li>Aún no hay hábitos.</li>";
  for (const h of hs) html += `<li>${esc(h.fecha)}: ${esc(h.habito)}</li>`;
  html += `</ul></section>`;

  html += `<section class="card"><h2>Hábitos de no consumo</h2>
    <p class="muted">Elige qué quieres evitar. Un tropiezo no te define: se vuelve a empezar sin juicio.</p>
    <label for="nc-sus">Sustancia o hábito</label>
    <select id="nc-sus">${SUST_NC.map((s)=>`<option value="${s}">${s}</option>`).join("")}<option value="custom">otro (escribir nombre)</option></select>
    <label for="nc-custom" class="hide" id="lab-custom">Nombre</label>
    <input id="nc-custom" class="hide">
    <label for="nc-inicio">Fecha de inicio</label>
    <input id="nc-inicio" type="date" value="${hoy()}">
    <p><button type="button" id="btn-nc-add">Añadir</button></p>`;
  const ncs = (mem.no_consumo || []).filter((h) => !h.archivado);
  for (const h of ncs) {
    const n = h.personalizado || h.sustancia;
    html += `<div class="card" style="margin:0.6rem 0 0;box-shadow:none">
      <p><strong>${esc(n)}</strong></p>
      <p class="dias">${diasLimpio(h)} días en limpio</p>
      <p class="muted">Inicio: ${esc(h.inicio)}</p>
      <label>¿Has consumido hoy?</label>
      <div class="row">
        <button type="button" class="sec btn-ck" data-id="${esc(h.id)}" data-c="0">No, en limpio</button>
        <button type="button" class="sec btn-ck" data-id="${esc(h.id)}" data-c="1">Sí, lo anoto</button>
      </div>
      <label>Antojo 0-10</label>
      <input type="range" min="0" max="10" value="0" class="ck-ant" data-id="${esc(h.id)}">
      <label>Qué lo ha disparado (opcional)</label>
      <input class="ck-nota" data-id="${esc(h.id)}" placeholder="una nota breve">
      <div class="resp-ck" data-id="${esc(h.id)}"></div>
    </div>`;
  }
  html += `</section><section class="card"><h2>Seguimiento</h2>
    <p class="muted">Rachas, antojos y emociones recientes.</p>
    <canvas class="chart" id="chart-ant" width="640" height="200"></canvas>
    <canvas class="chart" id="chart-emo" width="640" height="160" style="margin-top:.6rem"></canvas>
  </section>`;
  return html;
}

function vistaApoyo() {
  const r = mem.red_apoyo;
  const med = r.medico || {}, cen = r.centro || {};
  let html = `<section class="card"><h2>Red de apoyo</h2>
    <p class="muted">MAY prepara el mensaje; solo se envía si tú pulsas. Nunca en segundo plano.</p>
    <h3>Tu médico</h3>
    ${formContacto("medico", med)}
    <h3>Tu centro de ayuda</h3>
    ${formContacto("centro", cen)}
    <h3>Familia</h3>
    <div id="fam-lista">`;
  (r.familia_contactos || []).forEach((f, i) => {
    html += `<p>${esc(f.nombre)}${f.relacion ? " ("+esc(f.relacion)+")" : ""} ${esc(f.telefono || f.email || "")}</p>`;
  });
  html += `</div>
    <label>Añadir familiar (nombre)</label><input id="fam-n">
    <label>Relación</label><input id="fam-r">
    <label>Teléfono</label><input id="fam-t" inputmode="tel">
    <label>Correo</label><input id="fam-e" type="email">
    <p><button type="button" id="btn-fam">Apuntar familiar</button></p>
  </section>`;

  html += `<section class="card"><h2>Bots</h2>
    <p>Bot personal: ${esc(mem.bot.nombre || "sin nombre")} ${mem.bot.enlace ? `<a href="${esc(mem.bot.enlace)}" target="_blank" rel="noopener">abrir</a>` : "(sin enlace)"}</p>
    <label>Nombre de tu bot personal</label><input id="bot-n2" value="${esc(mem.bot.nombre)}">
    <label>Enlace</label><input id="bot-e2" value="${esc(mem.bot.enlace)}" placeholder="https://">
    <p><button type="button" class="sec" id="btn-bot">Guardar bot personal</button></p>
    <p>Bot agente de apoyo (por ejemplo, un bot de acompañamiento). Solo se le envía lo que tú elijas.</p>
    <label>Nombre del bot de apoyo</label><input id="ap-n" value="${esc(mem.bot_apoyo.nombre)}">
    <label>Enlace o URL</label><input id="ap-e" value="${esc(mem.bot_apoyo.enlace)}" placeholder="https://">
    <p><button type="button" class="sec" id="btn-bot-ap">Guardar bot de apoyo</button></p>
    <label>Mensaje actual para un bot (no se envía la memoria)</label>
    <textarea id="chat-msg" placeholder="Escribe solo lo que quieras enviar ahora"></textarea>
    <p class="row">
      <button type="button" class="sec" id="btn-abrir-bot">Abrir bot personal con este mensaje</button>
      <button type="button" class="sec" id="btn-abrir-ap">Abrir bot de apoyo con este mensaje</button>
    </p>
  </section>`;

  html += `<section class="card"><h2>Directorio autonómico</h2>
    <p class="muted">Servicios oficiales según el Plan Nacional sobre Drogas. Si un enlace no se pudo comprobar, aparece «pendiente de verificar». No se inventan teléfonos.</p>
    <label for="sel-ccaa">Tu comunidad o ciudad autónoma</label>
    <select id="sel-ccaa"><option value="">Elegir…</option>`;
  const lista = (ccaaDatos && ccaaDatos.ccaa) || [];
  for (const c of lista) {
    html += `<option value="${esc(c.id)}" ${r.ccaa===c.id?"selected":""}>${esc(c.nombre)}</option>`;
  }
  html += `</select><div id="ccaa-ficha">${fichaCcaa(r.ccaa)}</div>
    <p class="muted">Fuente: ${(ccaaDatos && ccaaDatos.fuente_listado) ? `<a href="${esc(ccaaDatos.fuente_listado.enlace)}" target="_blank" rel="noopener">${esc(ccaaDatos.fuente_listado.titulo)}</a>` : "PNSD"}.</p>
  </section>`;

  html += `<section class="card"><h2>Compartir un resumen</h2>
    <label class="row" style="display:flex;align-items:center;gap:.5rem">
      <input type="checkbox" id="inc-pruebas" style="width:auto;min-height:auto"> Incluir las pruebas de sustancias visibles (solo si tú lo marcas)
    </label>
    <textarea id="resumen-txt" readonly></textarea>
    <p class="row">
      <button type="button" class="sec" id="btn-gen-res">Preparar texto</button>
      <button type="button" class="sec" id="btn-copiar-res">Copiar</button>
      <button type="button" class="sec" id="btn-share">Compartir</button>
    </p>
    <div id="envios"></div>
  </section>`;
  return html;
}

function formContacto(tipo, c) {
  return `<label>Nombre</label><input data-ct="${tipo}" data-k="nombre" value="${esc(c.nombre||"")}">
    <label>Teléfono</label><input data-ct="${tipo}" data-k="telefono" value="${esc(c.telefono||"")}" inputmode="tel">
    <label>Correo</label><input data-ct="${tipo}" data-k="email" value="${esc(c.email||"")}" type="email">
    <label>WhatsApp (número)</label><input data-ct="${tipo}" data-k="whatsapp" value="${esc(c.whatsapp||"")}" inputmode="tel">
    <p><button type="button" class="sec btn-ct" data-ct="${tipo}">Guardar ${tipo==="medico"?"médico":"centro"}</button></p>`;
}

function fichaCcaa(id) {
  if (!id || !ccaaDatos) return "<p>Elige tu comunidad para ver el recurso oficial.</p>";
  const c = (ccaaDatos.ccaa || []).find((x) => x.id === id);
  if (!c) return "";
  let html = `<p><strong>${esc(c.nombre)}</strong></p><p>${esc(c.organismo)}</p><p>${esc(c.servicio)}</p>`;
  if (c.telefono) html += `<p>Teléfono oficial: <a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a></p>`;
  if (c.verificado && c.enlace) html += `<p><a href="${esc(c.enlace)}" target="_blank" rel="noopener">Abrir ficha oficial (enlace verificado)</a></p>`;
  else {
    html += `<p><span class="badge">pendiente de verificar</span></p>`;
    if (c.nota) html += `<p class="muted">${esc(c.nota)}</p>`;
    if (ccaaDatos.fuente_listado) html += `<p><a href="${esc(ccaaDatos.fuente_listado.enlace)}" target="_blank" rel="noopener">Consultar el listado oficial del PNSD</a></p>`;
  }
  html += `<p class="muted">${esc(AVISO)}</p>`;
  return html;
}

function vistaMas() {
  return vistaPruebas() + vistaMayores() + vistaJuegos() + vistaFuentes() + vistaNotasExport();
}

function vistaPruebas() {
  let html = `<section class="card"><h2>Datos del detector de sustancias</h2>
    <p>${esc(AVISO_DETECTOR)}</p>
    <p class="pro">${esc(AVISO_ID)}</p>
    <p>Los resultados clínicos los introduce el profesional de tu unidad, no tú. Puedes importar su código o abrir el modo profesional en la consulta (PIN profesional distinto). Un autotest casero se apunta aparte y no sustituye una prueba profesional.</p>
    <p><a href="profesional.html">Abrir la página Profesional</a> (para que el profesional genere el código o el QR).</p>
    <label>Pegar código de importación (JSON o MAY1:…)</label>
    <textarea id="imp-codigo" placeholder="MAY1:..."></textarea>
    <p class="row">
      <button type="button" id="btn-importar">Importar prueba</button>
      <button type="button" class="sec" id="btn-modo-prof">Modo profesional</button>
    </p>
    <p class="ok hide" id="imp-ok"></p>
    <p class="err hide" id="imp-err"></p>
    <div id="modo-prof" class="hide">${formProfesionalInterno()}</div>
    ${tablaPruebas()}
    <h3>Autotest casero</h3>
    <p class="muted">Queda etiquetado como autotest casero, separado de las pruebas profesionales. No es un análisis de tu unidad.</p>
    ${formAutotest()}
  </section>`;
  return html;
}

function formProfesionalInterno() {
  return `<p class="pro">El profesional introduce aquí los resultados, en la consulta, con un PIN profesional. ${esc(AVISO_ID)}</p>
    <div id="prof-gate"></div>
    <div id="prof-form" class="hide">
      <label>Centro o unidad</label><input id="pf-centro">
      <label>Nombre del profesional</label><input id="pf-nombre">
      <label>Nº colegiado (opcional)</label><input id="pf-col">
      <label>Fecha</label><input id="pf-fecha" type="date" value="${hoy()}">
      <label>Tipo</label><select id="pf-tipo">${TIPOS_PRUEBA.map((t)=>`<option>${t}</option>`).join("")}</select>
      <div id="pf-sus"></div>
      <label>Nota</label><textarea id="pf-nota"></textarea>
      <p><button type="button" id="btn-pf-guardar">Guardar prueba profesional</button></p>
    </div>`;
}

function formAutotest() {
  let s = `<label>Fecha</label><input id="at-fecha" type="date" value="${hoy()}">
    <label>Tipo</label><select id="at-tipo">${TIPOS_PRUEBA.map((t)=>`<option>${t}</option>`).join("")}</select><div id="at-sus">`;
  for (const n of PANEL12) {
    s += `<label>${esc(n)}</label><select data-at="${esc(n)}"><option>no analizado</option><option>negativo</option><option>positivo</option></select>`;
  }
  s += `</div><label>Nota</label><textarea id="at-nota"></textarea>
    <p><button type="button" class="sec" id="btn-autotest">Anotar autotest casero</button></p>`;
  return s;
}

function tablaPruebas() {
  const items = mem.pruebas_sustancias || [];
  if (!items.length) return "<p>Aún no hay pruebas anotadas.</p>";
  let html = `<table class="tabla"><thead><tr><th>Fecha</th><th>Origen</th><th>Resultados</th><th></th></tr></thead><tbody>`;
  items.forEach((p, i) => {
    const pr = p.profesional || {};
    let origen = p.origen;
    let badge = "badge";
    if (p.origen === "autotest-casero") { origen = "autotest casero"; badge += " casa"; }
    if (p.origen === "sensor-futuro") { origen = "sensor futuro (concepto)"; badge += " futuro"; }
    if (p.origen === "profesional") origen = "profesional" + (pr.nombre || pr.centro ? " · " + [pr.nombre, pr.centro, pr.colegiado].filter(Boolean).join(", ") : "");
    const pos = Object.entries(p.resultados||{}).filter(([,v])=>v==="positivo").map(([s])=>s);
    const neg = Object.entries(p.resultados||{}).filter(([,v])=>v==="negativo").map(([s])=>s);
    const oculto = p.ocultar_en_resumen ? " (oculta en resúmenes)" : "";
    html += `<tr><td>${esc(p.fecha)}<br><span class="muted">${esc(p.tipo)}</span></td>
      <td><span class="${badge}">${esc(origen)}</span>${esc(oculto)}</td>
      <td>${pos.length? "<strong>positivos (a confirmar):</strong> "+esc(pos.join(", "))+"<br>":""}${neg.length? "negativos: "+esc(neg.join(", ")):""}${p.nota?"<br>nota: "+esc(p.nota):""}</td>
      <td><button type="button" class="sec btn-ocultar" data-i="${i}">${p.ocultar_en_resumen?"Mostrar":"Ocultar"}</button></td></tr>`;
  });
  html += "</tbody></table>";
  return html;
}

function pendienteMayor(c) {
  if (!mem.modo_mayores) return false;
  const u = c.ultima_respuesta, cuando = c.ultima_cuando ? new Date(c.ultima_cuando) : null;
  const mismo = cuando && cuando.toISOString().slice(0,10) === hoy();
  if (u === "sí" && mismo) return false;
  if (c.hora) {
    const now = new Date();
    const [hh, mm] = c.hora.split(":").map(Number);
    if (!mismo && (now.getHours() < hh || (now.getHours()===hh && now.getMinutes()<mm))) return false;
  }
  return true;
}

function vistaMayores() {
  let html = `<section class="card"><h2>Modo mayores</h2>
    <p class="muted">Comprobaciones de seguridad y medicación, con calma. ${esc(AVISO)} Emergencias: 112.</p>
    <p><button type="button" class="sec" id="btn-modo-may">${mem.modo_mayores?"Pasar a modo normal":"Activar modo mayores"}</button></p>`;
  if (mem.modo_mayores) {
    html += "<ul class='lista'>";
    (mem.mayores_checks || []).forEach((c, i) => {
      const pend = pendienteMayor(c);
      html += `<li>${esc(c.hora || "cuando haga falta")} — ${esc(c.pregunta)} — ${pend?"pendiente":"hecho hoy"}
        <span class="row"><button type="button" class="sec btn-may" data-i="${i}" data-r="sí">Sí</button>
        <button type="button" class="sec btn-may" data-i="${i}" data-r="no">No</button></span></li>`;
    });
    html += `</ul>
      <label>Añadir recordatorio (hora HH:MM y texto)</label>
      <div class="row"><input id="may-hora" placeholder="09:00" style="flex:0 0 7rem">
      <input id="may-txt" placeholder="pastilla del azúcar"></div>
      <p><button type="button" class="sec" id="btn-may-add">Añadir</button></p>`;
  }
  html += "</section>";
  return html;
}

const REFRANES = [
  ["Más vale pájaro en mano que…", ["ciento volando","ciento volando."], "Piensa en un número grande de pájaros, volando."],
  ["Más vale tarde que…", ["nunca"], "Es lo contrario de «alguna vez»."],
  ["A quien madruga, Dios le…", ["ayuda"], "Es lo que hace quien echa una mano."],
  ["No hay mal que por bien no…", ["venga"], "Es lo que hace algo cuando llega."],
  ["En casa del herrero, cuchillo de…", ["palo"], "Un material sencillo, de árbol."]
];
const CATS = [
  ["¿Cuál no es una fruta?", ["manzana","pera","silla","plátano"], "silla", "Tres se comen; una se usa para sentarse."],
  ["¿Cuál no es un animal?", ["gato","perro","mesa","pájaro"], "mesa", "Tres tienen vida; una está en el comedor."],
  ["¿Cuál no es un color?", ["rojo","azul","sábado","verde"], "sábado", "Tres se ven; uno es un día de la semana."]
];
const MONEDAS = [
  ["Tienes 1 euro y una moneda de 50 céntimos. ¿Cuánto tienes en total?", ["1,50","1.50","1,5","1.5"], "Junta 1 euro y medio euro."],
  ["Tienes dos monedas de 1 euro. ¿Cuánto dinero tienes?", ["2","2 euros","2€"], "1 y 1."]
];
const SECUENCIAS = [
  ["Ordena los pasos para lavarse las manos. Escribe los números, por ejemplo 2-1-3.\n1. Enjabonarse\n2. Abrir el grifo y mojarse\n3. Aclarar y secarse", ["2-1-3","213","2 1 3"], "Primero se mojan, luego el jabón y al final se aclaran."]
];

function vistaJuegos() {
  let html = `<section class="card" id="vista-juego"><h2>Juegos de estimulación</h2>
    <p class="muted">Sesión corta de 5 ejercicios, con calma. Nunca se dice «mal». Si no sale, hay una pista, se puede intentar otra vez o saltar. ${esc(AVISO)}</p>`;
  if (!juego) {
    html += `<p><button type="button" id="btn-juego">Empezar una sesión</button></p></section>`;
    return html;
  }
  if (juego.fin) {
    html += `<p>Has terminado la sesión: ${juego.aciertos} de ${juego.total} a la primera o con calma. Lo importante es haberlo intentado.</p>
      <p><button type="button" id="btn-juego">Otra sesión</button></p></section>`;
    return html;
  }
  const p = juego.preguntas[juego.i];
  html += `<p><strong>Ejercicio ${juego.i+1} de ${juego.preguntas.length}</strong></p>
    <p>${nl(p.texto)}</p>`;
  if (p.opciones) {
    html += "<div class='row'>";
    for (const o of p.opciones) html += `<button type="button" class="sec btn-jop" data-v="${esc(o)}">${esc(o)}</button>`;
    html += "</div>";
  } else {
    html += `<input id="j-resp" autocomplete="off"><p><button type="button" id="btn-jok">Responder</button></p>`;
  }
  html += `<p class="row"><button type="button" class="sec" id="btn-pista">Pista</button>
    <button type="button" class="sec" id="btn-saltar">Saltar</button></p>
    <p id="j-msg"></p></section>`;
  return html;
}

function nuevaSesion() {
  const dias = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
  const hoyD = new Date();
  const dia = dias[(hoyD.getDay()+6)%7];
  const mes = hoyD.getMonth()+1, d = hoyD.getDate();
  let est = "invierno";
  if ((mes===3&&d>=21)||[4,5].includes(mes)||(mes===6&&d<=20)) est="primavera";
  else if ((mes===6&&d>=21)||[7,8].includes(mes)||(mes===9&&d<=22)) est="verano";
  else if ((mes===9&&d>=23)||[10,11].includes(mes)||(mes===12&&d<=20)) est="otoño";
  const pool = [
    { texto: "¿Qué día de la semana es hoy?", ok: [dia], pista: "Piensa en el día de hoy, con calma." },
    { texto: "¿En qué estación estamos? (en España)", ok: [est], pista: "Primavera, verano, otoño o invierno, según la fecha de hoy." }
  ];
  const r = REFRANES[Math.floor(Math.random()*REFRANES.length)];
  pool.push({ texto: "Completa el refrán:\n" + r[0], ok: r[1], pista: r[2] });
  const c = CATS[Math.floor(Math.random()*CATS.length)];
  pool.push({ texto: c[0], opciones: c[1], ok: [c[2]], pista: c[3] });
  const m = MONEDAS[Math.floor(Math.random()*MONEDAS.length)];
  pool.push({ texto: m[0], ok: m[1], pista: m[2] });
  const s = SECUENCIAS[0];
  pool.push({ texto: s[0], ok: s[1], pista: s[2] });
  const pal = [["sol","casa","pan"],["flor","agua","mesa"],["gato","libro","luna"]][Math.floor(Math.random()*3)];
  pool.push({ texto: "Memoria: recuerda estas tres palabras (las verás y luego las escribes): " + pal.join(", ") + ".\nCuando quieras, escríbelas.", ok: [pal.join(" "), pal.join(","), pal.join(", ")], pista: "Son tres palabras sencillas que acabas de ver." });
  // 5 questions
  const preguntas = pool.sort(() => Math.random()-0.5).slice(0,5);
  juego = { preguntas, i: 0, aciertos: 0, total: 5, intentos: 0, fin: false };
}

function normaliza(s) {
  return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿?.,!]/g,"").replace(/\s+/g," ").trim();
}
function acierta(resp, ok) {
  const r = normaliza(resp);
  return (ok||[]).some((a) => {
    const b = normaliza(a);
    return r === b || r.includes(b) || b.includes(r);
  });
}

function vistaFuentes() {
  let html = `<section class="card"><h2>Fuentes</h2>
    <p>Base de conocimiento de MAY. ${esc(AVISO)} Los textos son resúmenes propios; no copian el libro.</p>
    <h3>Técnicas que usa MAY</h3><ul class="lista">`;
  for (const t of MAY_AI.tecnicas()) {
    html += `<li><strong>${esc(t.titulo)}</strong>. ${esc(t.fuente)}. `;
    html += t.enlace ? `<a href="${esc(t.enlace)}" target="_blank" rel="noopener">Enlace verificado</a>` : "Sin enlace verificado.";
    html += `</li>`;
  }
  html += `</ul><h3>Recursos y lecturas</h3><ul class="lista">`;
  for (const r of MAY_AI.recursos()) {
    html += `<li><strong>${esc(r.titulo)}</strong> — ${esc(r.autor)}. `;
    html += r.enlace ? `<a href="${esc(r.enlace)}" target="_blank" rel="noopener">${esc(r.enlace)}</a>` : "Sin enlace verificado.";
    if (r.descripcion) html += `<br><span class="muted">${esc(r.descripcion)}</span>`;
    html += "</li>";
  }
  html += "</ul></section>";
  return html;
}

function vistaNotasExport() {
  let html = `<section class="card"><h2>Notas y memoria</h2>
    <label>Nueva nota</label><textarea id="nota-txt"></textarea>
    <p><button type="button" class="sec" id="btn-nota">Guardar nota</button></p>
    <ul class="lista">`;
  for (const n of (mem.notas||[]).slice().reverse()) html += `<li>${esc(n)}</li>`;
  if (!(mem.notas||[]).length) html += "<li>Sin notas.</li>";
  html += `</ul></section>
    <section class="card"><h2>Exportar</h2>
      <p>Copia cifrada (se abre con tu mismo PIN) o copia en claro, solo si escribes SÍ.</p>
      <p class="row">
        <button type="button" class="sec" id="btn-exp">Descargar copia cifrada</button>
      </p>
      <label>Para una copia en claro, escribe SÍ</label>
      <input id="exp-si" placeholder="SÍ">
      <p><button type="button" class="sec" id="btn-exp-claro">Descargar JSON en claro</button></p>
    </section>`;
  return html;
}

/* —— charts —— */
function dibujarCharts() {
  const c1 = $("chart-ant"), c2 = $("chart-emo");
  if (c1) {
    const ctx = c1.getContext("2d");
    const w = c1.width, h = c1.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#5a675f";
    ctx.fillText("Antojos (0-10) de los últimos 14 días", 12, 18);
    const days = [];
    for (let i=13;i>=0;i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      days.push(d.toISOString().slice(0,10));
    }
    const vals = days.map((d) => {
      let m = null;
      for (const h of mem.no_consumo || []) {
        for (const c of h.historial || []) {
          if (String(c.fecha).slice(0,10)===d && typeof c.antojo === "number") m = c.antojo;
        }
      }
      return m;
    });
    ctx.strokeStyle = "#1b6b58"; ctx.lineWidth = 2; ctx.beginPath();
    let started=false;
    vals.forEach((v,i) => {
      if (v==null) return;
      const x = 20 + i*((w-40)/13), y = h-20 - (v/10)*(h-50);
      if (!started) { ctx.moveTo(x,y); started=true; } else ctx.lineTo(x,y);
      ctx.fillRect(x-2,y-2,4,4);
    });
    ctx.stroke();
    if (!started) { ctx.fillText("Aún no hay antojos anotados.", 12, 48); }
  }
  if (c2) {
    const ctx = c2.getContext("2d");
    const w=c2.width,h=c2.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#5a675f";
    ctx.fillText("Emociones recientes (intensidad)", 12, 18);
    const emos = (mem.emociones||[]).slice(-10);
    const bw = emos.length ? (w-40)/emos.length : 0;
    emos.forEach((e,i) => {
      const barh = (e.intensidad||1)/3*(h-50);
      ctx.fillStyle = NEGATIVAS.has(e.emocion) ? "#8b2f2f" : "#1b6b58";
      ctx.fillRect(20+i*bw+4, h-20-barh, Math.max(8,bw-8), barh);
    });
    if (!emos.length) ctx.fillText("Aún no hay emociones anotadas.", 12, 48);
  }
}

/* —— import code —— */
function decodificarCodigo(texto) {
  texto = (texto||"").trim();
  if (texto.startsWith("MAY1:")) texto = texto.slice(5);
  const tries = [texto];
  try {
    const bin = atob(texto);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    tries.push(new TextDecoder().decode(bytes));
  } catch (e) {}
  for (const t of tries) {
    try { return JSON.parse(t); } catch (e) {}
  }
  return null;
}

function entradasDePayload(datos) {
  if (!datos || typeof datos !== "object") return { error: "El código no es un documento válido." };
  if (datos.formato && datos.formato !== "may-sobria-sensor") return { error: "Formato no reconocido: " + datos.formato };
  if ((datos.version||1) > 1) return { error: "Esta versión del formato aún no la entiendo." };
  let origen = (datos.origen||"profesional").toLowerCase();
  if (["sensor","sensor-futuro","may-sobria"].includes(origen)) origen = "sensor-futuro";
  if (!["profesional","sensor-futuro"].includes(origen)) return { error: "Este código no es de un profesional ni del formato de sensor futuro." };
  const profesional = datos.profesional || {};
  let muestras = datos.muestras || datos.pruebas || [];
  if (!muestras.length && datos.resultados) muestras = [datos];
  if (!muestras.length) return { error: "El código no trae ninguna muestra." };
  const out = muestras.map((m) => {
    let res = m.resultados || m.sustancias || {};
    if (Array.isArray(res)) {
      const o = {};
      res.forEach((x) => { if (x && x.nombre) o[x.nombre] = x.resultado; });
      res = o;
    }
    const resultados = {};
    PANEL12.forEach((s) => {
      const key = Object.keys(res).find((k) => k.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(k.toLowerCase()));
      const v = key ? String(res[key]).toLowerCase() : "no analizado";
      resultados[s] = v.startsWith("pos") ? "positivo" : v.startsWith("neg") ? "negativo" : "no analizado";
    });
    return {
      id: uid(), origen, fecha: (m.fecha || datos.fecha || hoy()).slice(0,16),
      tipo: m.tipo || datos.tipo || "otro",
      profesional: m.profesional || profesional,
      resultados, nota: m.nota || "", ocultar_en_resumen: false, importado: true
    };
  });
  return { entradas: out };
}

async function pbkdf2Raw(pin, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt, iterations: 200000, hash:"SHA-256" }, material, 256);
  return new Uint8Array(bits);
}
function b64u(u8) { let s=""; u8.forEach((b)=>s+=String.fromCharCode(b)); return btoa(s); }
function u8b64(s) { const b=atob(s); const u=new Uint8Array(b.length); for (let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }

async function setPinProf(p1, p2) {
  if (!p1 || p1.length < 4) return "El PIN profesional tiene que tener al menos 4 caracteres.";
  if (p1 !== p2) return "Los PIN profesionales no coinciden.";
  const saltP = crypto.getRandomValues(new Uint8Array(16));
  const ver = await pbkdf2Raw(p1, saltP);
  mem.profesional_acceso = { salt: b64u(saltP), verificador: b64u(ver) };
  await persistir();
  return "";
}
async function checkPinProf(p) {
  const acc = mem.profesional_acceso || {};
  if (!acc.salt || !acc.verificador) return false;
  const ver = await pbkdf2Raw(p, u8b64(acc.salt));
  const ok = u8b64(acc.verificador);
  if (ver.length !== ok.length) return false;
  let s = 0; for (let i=0;i<ver.length;i++) s |= ver[i]^ok[i];
  return s === 0;
}

function abrirBot(cual) {
  const bot = cual === "apoyo" ? mem.bot_apoyo : mem.bot;
  const msg = ($("chat-msg") && $("chat-msg").value.trim()) || "";
  if (!bot.enlace) { alert("Aún no hay enlace de ese bot. Guárdalo primero."); return; }
  const tecs = MAY_AI.elegir(["tristeza","antojo"], 2);
  const ctx = msg ? MAY_AI.contextoBot(tecs) : "";
  const texto = [msg, ctx].filter(Boolean).join("\n\n");
  if (texto && navigator.clipboard) navigator.clipboard.writeText(texto).catch(()=>{});
  window.open(bot.enlace, "_blank", "noopener");
}

function enlacesEnvio(texto) {
  const r = mem.red_apoyo;
  const bloques = [];
  const add = (titulo, c) => {
    if (!c || !(c.telefono || c.email || c.whatsapp)) return;
    const tel = (c.telefono||"").replace(/[^\d+]/g,"");
    const wa = (c.whatsapp||c.telefono||"").replace(/\D/g,"");
    let h = `<p><strong>${esc(titulo)}: ${esc(c.nombre||"")}</strong><br>`;
    if (tel) h += `<a class="tel" href="tel:${esc(tel)}">Llamar</a> <a class="tel" href="sms:${esc(tel)}?body=${encodeURIComponent(texto)}">SMS</a> `;
    if (wa) h += `<a class="tel" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">WhatsApp</a> `;
    if (c.email) h += `<a class="tel" href="mailto:${esc(c.email)}?subject=${encodeURIComponent("Resumen MAY AI OS")}&body=${encodeURIComponent(texto)}">Correo</a>`;
    h += "</p>";
    bloques.push(h);
  };
  add("Médico", r.medico);
  add("Centro", r.centro);
  (r.familia_contactos||[]).forEach((f)=>add("Familia", f));
  return bloques.join("") || "<p class='muted'>Apunta un teléfono, correo o WhatsApp para ver los botones de envío. MAY no envía nada sola.</p>";
}

function resultadosDe(pref) {
  const res = {};
  document.querySelectorAll("select[data-"+pref+"]").forEach((s) => { res[s.getAttribute("data-"+pref)] = s.value; });
  return res;
}

function enlazar() {
  document.querySelectorAll(".emo").forEach((b) => b.onclick = () => { emocionSel = b.getAttribute("data-emo"); pintar(); });
  document.querySelectorAll(".niv").forEach((b) => b.onclick = () => { nivelSel = +b.getAttribute("data-n"); pintar(); });
  const bs = $("btn-siento");
  if (bs) bs.onclick = async () => {
    if (!emocionSel) { $("resp-emo").innerHTML = "<p>Elige antes una emoción.</p>"; return; }
    const nombre = RUEDA[emocionSel][nivelSel-1];
    mem.emociones.push({ fecha: ahora(), emocion: emocionSel, intensidad: nivelSel, nombre });
    await persistir();
    contarUso();
    const alta = nivelSel === 3 && NEGATIVAS.has(emocionSel);
    const tags = [emocionSel];
    if (alta) tags.push("intensidad-alta");
    const tecs = MAY_AI.elegir(tags, alta || NEGATIVAS.has(emocionSel) ? 2 : 1);
    const base = NEGATIVAS.has(emocionSel)
      ? "Anoto " + nombre + ". Gracias por decírmelo; estoy aquí, sin juicio."
      : "Anoto " + nombre + ". Me alegra que lo hayas apuntado.";
    let html = "<div class='card' style='box-shadow:none'><p>" + nl(MAY_AI.formatear(base, tecs, alta)) + "</p>";
    const bot = mem.bot || {};
    if (bot.enlace) {
      html += `<p class="muted">Si quieres, abre tu bot (${esc(bot.nombre||"bot")}) con este apoyo (solo el mensaje actual y las técnicas, no tu memoria): <a href="${esc(bot.enlace)}" target="_blank" rel="noopener">abrir ${esc(bot.nombre||"bot")}</a></p>`;
    }
    if (alta) html += botonesAyuda();
    html += "</div>";
    lastEmoHtml = html;
    pintar();
  };

  const bh = $("btn-habito");
  if (bh) bh.onclick = async () => {
    const t = $("habito-txt").value.trim();
    if (!t) return;
    mem.habitos.push({ fecha: hoy(), habito: t });
    await persistir(); pintar();
  };
  const selNc = $("nc-sus");
  if (selNc) selNc.onchange = () => {
    const custom = selNc.value === "custom";
    $("lab-custom").classList.toggle("hide", !custom);
    $("nc-custom").classList.toggle("hide", !custom);
  };
  const ba = $("btn-nc-add");
  if (ba) ba.onclick = async () => {
    let s = $("nc-sus").value, custom = "";
    if (s === "custom") { custom = $("nc-custom").value.trim(); s = "otras"; if (!custom) return; }
    mem.no_consumo.push({ id: uid(), sustancia: s, personalizado: custom, inicio: $("nc-inicio").value || hoy(), historial: [] });
    await persistir(); pintar();
  };
  document.querySelectorAll(".btn-ck").forEach((b) => b.onclick = async () => {
    const id = b.getAttribute("data-id");
    const consumio = b.getAttribute("data-c") === "1";
    const ant = document.querySelector(".ck-ant[data-id='"+id+"']");
    const nota = document.querySelector(".ck-nota[data-id='"+id+"']");
    const antojo = ant ? +ant.value : 0;
    const h = mem.no_consumo.find((x) => x.id === id);
    if (!h) return;
    h.historial = (h.historial||[]).filter((c) => String(c.fecha).slice(0,10) !== hoy());
    h.historial.push({ fecha: hoy(), consumio, antojo, nota: nota ? nota.value.trim() : "" });
    if (consumio) h.inicio = hoy();
    await persistir();
    contarUso();
    const tags = ["antojo", consumio ? "recaida" : "", h.sustancia];
    const alta = antojo >= 8 || consumio;
    const tecs = MAY_AI.elegir(tags, 2);
    let base;
    const n = h.personalizado || h.sustancia;
    if (consumio) {
      base = "Gracias por decírmelo. Un tropiezo no te define ni borra lo que ya has hecho. Hoy volvemos a contar «" + n + "» desde aquí, con calma, sin juicio.";
    } else {
      base = "Anoto el día en limpio de «" + n + "»: " + diasLimpio(h) + " días. Antojo " + antojo + "/10.";
    }
    const box = document.querySelector(".resp-ck[data-id='"+id+"']");
    let html = "<p>" + nl(MAY_AI.formatear(base, tecs, alta)) + "</p>";
    if (alta) html += botonesAyuda();
    if (box) box.innerHTML = html;
  });

  document.querySelectorAll(".btn-ct").forEach((b) => b.onclick = async () => {
    const tipo = b.getAttribute("data-ct");
    const c = {};
    document.querySelectorAll("[data-ct='"+tipo+"']").forEach((i) => { c[i.getAttribute("data-k")] = i.value.trim(); });
    mem.red_apoyo[tipo] = c;
    await persistir();
    alert("Guardado.");
  });
  const bf = $("btn-fam");
  if (bf) bf.onclick = async () => {
    const n = $("fam-n").value.trim(); if (!n) return;
    mem.red_apoyo.familia_contactos.push({ nombre:n, relacion:$("fam-r").value.trim(), telefono:$("fam-t").value.trim(), email:$("fam-e").value.trim(), whatsapp:$("fam-t").value.trim() });
    await persistir(); pintar();
  };
  const bb = $("btn-bot");
  if (bb) bb.onclick = async () => { mem.bot = { nombre:$("bot-n2").value.trim(), enlace:$("bot-e2").value.trim() }; await persistir(); pintar(); };
  const bba = $("btn-bot-ap");
  if (bba) bba.onclick = async () => { mem.bot_apoyo = { nombre:$("ap-n").value.trim(), enlace:$("ap-e").value.trim() }; await persistir(); pintar(); };
  if ($("btn-abrir-bot")) $("btn-abrir-bot").onclick = () => abrirBot("bot");
  if ($("btn-abrir-ap")) $("btn-abrir-ap").onclick = () => abrirBot("apoyo");
  if ($("sel-ccaa")) $("sel-ccaa").onchange = async () => {
    mem.red_apoyo.ccaa = $("sel-ccaa").value;
    await persistir();
    $("ccaa-ficha").innerHTML = fichaCcaa(mem.red_apoyo.ccaa);
  };
  if ($("btn-gen-res")) $("btn-gen-res").onclick = () => {
    const t = resumenTexto($("inc-pruebas").checked);
    $("resumen-txt").value = t;
    $("envios").innerHTML = enlacesEnvio(t);
  };
  if ($("btn-copiar-res")) $("btn-copiar-res").onclick = async () => {
    if (!$("resumen-txt").value) $("btn-gen-res").click();
    try { await navigator.clipboard.writeText($("resumen-txt").value); } catch (e) { $("resumen-txt").select(); }
  };
  if ($("btn-share")) $("btn-share").onclick = async () => {
    if (!$("resumen-txt").value) $("btn-gen-res").click();
    const t = $("resumen-txt").value;
    if (navigator.share) {
      try { await navigator.share({ title: "Resumen MAY AI OS", text: t }); } catch (e) {}
    } else {
      try { await navigator.clipboard.writeText(t); alert("He copiado el resumen. Pégalo donde quieras. MAY no lo envía sola."); } catch (e) { $("resumen-txt").select(); }
    }
  };

  if ($("btn-importar")) $("btn-importar").onclick = async () => {
    $("imp-ok").classList.add("hide"); $("imp-err").classList.add("hide");
    const datos = decodificarCodigo($("imp-codigo").value);
    if (!datos) { $("imp-err").textContent = "No he podido leer ese código."; $("imp-err").classList.remove("hide"); return; }
    const r = entradasDePayload(datos);
    if (r.error) { $("imp-err").textContent = r.error; $("imp-err").classList.remove("hide"); return; }
    mem.pruebas_sustancias = (mem.pruebas_sustancias||[]).concat(r.entradas);
    await persistir();
    pintar();
  };
  if ($("btn-modo-prof")) $("btn-modo-prof").onclick = () => {
    $("modo-prof").classList.toggle("hide");
    pintarGateProf();
  };
  document.querySelectorAll(".btn-ocultar").forEach((b) => b.onclick = async () => {
    const i = +b.getAttribute("data-i");
    const p = mem.pruebas_sustancias[i];
    if (p) { p.ocultar_en_resumen = !p.ocultar_en_resumen; await persistir(); pintar(); }
  });
  if ($("btn-autotest")) $("btn-autotest").onclick = async () => {
    const resultados = {};
    document.querySelectorAll("select[data-at]").forEach((s) => { resultados[s.getAttribute("data-at")] = s.value; });
    mem.pruebas_sustancias.push({
      id: uid(), origen: "autotest-casero", fecha: $("at-fecha").value || hoy(),
      tipo: $("at-tipo").value, profesional: {}, resultados, nota: $("at-nota").value.trim(),
      ocultar_en_resumen: false, importado: false
    });
    await persistir(); pintar();
  };

  if ($("btn-modo-may")) $("btn-modo-may").onclick = async () => {
    mem.modo_mayores = !mem.modo_mayores;
    if (mem.modo_mayores && !(mem.mayores_checks||[]).length) {
      mem.mayores_checks = PREGUNTAS_MAY.map((p) => ({ pregunta:p, hora:"", ultima_respuesta:null, ultima_cuando:null }));
    }
    await persistir(); pintar();
  };
  document.querySelectorAll(".btn-may").forEach((b) => b.onclick = async () => {
    const i = +b.getAttribute("data-i");
    const c = mem.mayores_checks[i];
    if (c) { c.ultima_respuesta = b.getAttribute("data-r"); c.ultima_cuando = ahora(); await persistir(); pintar(); }
  });
  if ($("btn-may-add")) $("btn-may-add").onclick = async () => {
    const hora = ($("may-hora").value||"").trim();
    const txt = ($("may-txt").value||"").trim();
    if (!txt) return;
    let pregunta = txt.endsWith("?") ? txt : "¿Te has acordado de " + txt + "?";
    mem.mayores_checks.push({ pregunta, hora, ultima_respuesta:null, ultima_cuando:null });
    await persistir(); pintar();
  };

  if ($("btn-juego")) $("btn-juego").onclick = () => { nuevaSesion(); pintar(); };
  if ($("btn-pista") && juego && !juego.fin) $("btn-pista").onclick = () => { $("j-msg").textContent = "Pista: " + (juego.preguntas[juego.i].pista || "Tómatelo con calma."); };
  if ($("btn-saltar") && juego && !juego.fin) $("btn-saltar").onclick = () => { siguienteJuego(false); };
  if ($("btn-jok") && juego && !juego.fin) $("btn-jok").onclick = () => responderJuego($("j-resp").value);
  document.querySelectorAll(".btn-jop").forEach((b) => b.onclick = () => responderJuego(b.getAttribute("data-v")));

  if ($("btn-nota")) $("btn-nota").onclick = async () => {
    const t = $("nota-txt").value.trim(); if (!t) return;
    mem.notas.push(t); await persistir(); pintar();
  };
  if ($("btn-exp")) $("btn-exp").onclick = () => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([raw], {type:"application/json"}));
    a.download = "may-memoria-cifrada.may.json";
    a.click();
  };
  if ($("btn-exp-claro")) $("btn-exp-claro").onclick = () => {
    if ($("exp-si").value !== "SÍ") { alert("Escribe SÍ (en mayúsculas) para confirmar la copia en claro."); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(mem,null,2)], {type:"application/json"}));
    a.download = "may-memoria-claro.json";
    a.click();
  };

  dibujarCharts();
  pintarSustanciasProf();
}

function responderJuego(resp) {
  if (!juego || juego.fin) return;
  const p = juego.preguntas[juego.i];
  const msg = $("j-msg");
  if (acierta(resp, p.ok)) {
    if (msg) msg.textContent = "Muy bien. Vamos con calma al siguiente.";
    juego.aciertos++;
    setTimeout(() => siguienteJuego(true), 600);
  } else {
    juego.intentos = (juego.intentos||0)+1;
    if (msg) msg.textContent = "No es exactamente eso. Si quieres, mira la pista o inténtalo otra vez. También puedes saltar.";
  }
}
async function siguienteJuego() {
  if (!juego) return;
  juego.intentos = 0;
  juego.i++;
  if (juego.i >= juego.preguntas.length) {
    juego.fin = true;
    mem.juegos.push({ fecha: ahora(), aciertos: juego.aciertos, total: juego.total });
    await persistir();
  }
  pintar();
}

function pintarSustanciasProf() {
  const box = $("pf-sus");
  if (!box || box.childElementCount) return;
  for (const s of PANEL12) {
    const lab = document.createElement("label"); lab.textContent = s;
    const sel = document.createElement("select"); sel.setAttribute("data-pf", s);
    ["no analizado","negativo","positivo"].forEach((v) => { const o=document.createElement("option"); o.value=v; o.textContent=v; sel.appendChild(o); });
    box.appendChild(lab); box.appendChild(sel);
  }
}

function pintarGateProf() {
  const gate = $("prof-gate"), form = $("prof-form");
  if (!gate) return;
  const hay = mem.profesional_acceso && mem.profesional_acceso.salt;
  if (!hay) {
    gate.innerHTML = `<p>Primera vez en esta consulta: el profesional elige un PIN propio (no es el PIN de la persona).</p>
      <label>PIN profesional</label><input id="pp1" type="password">
      <label>Repite el PIN profesional</label><input id="pp2" type="password">
      <p class="err hide" id="pp-err"></p>
      <p><button type="button" id="btn-pp-set">Guardar PIN profesional</button></p>`;
    $("btn-pp-set").onclick = async () => {
      const e = await setPinProf($("pp1").value, $("pp2").value);
      if (e) { $("pp-err").textContent = e; $("pp-err").classList.remove("hide"); return; }
      form.classList.remove("hide"); gate.innerHTML = "<p class='ok'>PIN profesional guardado. " + esc(AVISO_ID) + "</p>";
      pintarSustanciasProf();
    };
  } else {
    gate.innerHTML = `<p>Introduce el PIN profesional para anotar una prueba.</p>
      <label>PIN profesional</label><input id="pp" type="password">
      <p class="err hide" id="pp-err"></p>
      <p><button type="button" id="btn-pp-ok">Entrar</button></p>`;
    $("btn-pp-ok").onclick = async () => {
      if (!(await checkPinProf($("pp").value))) { $("pp-err").textContent = "PIN profesional incorrecto."; $("pp-err").classList.remove("hide"); return; }
      form.classList.remove("hide"); gate.innerHTML = "<p class='ok'>Modo profesional activo en esta sesión.</p>";
      pintarSustanciasProf();
    };
  }
  const bg = $("btn-pf-guardar");
  if (bg) bg.onclick = async () => {
    const resultados = {};
    document.querySelectorAll("select[data-pf]").forEach((s) => { resultados[s.getAttribute("data-pf")] = s.value; });
    mem.pruebas_sustancias.push({
      id: uid(), origen: "profesional", fecha: ($("pf-fecha")&&$("pf-fecha").value) || hoy(),
      tipo: ($("pf-tipo")&&$("pf-tipo").value) || "orina",
      profesional: { centro: $("pf-centro").value.trim(), nombre: $("pf-nombre").value.trim(), colegiado: $("pf-col").value.trim() },
      resultados, nota: $("pf-nota").value.trim(), ocultar_en_resumen: false, importado: false
    });
    await persistir(); pintar();
  };
}

document.getElementById("nav").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-ir]");
  if (b) ir(b.getAttribute("data-ir"));
});

(async function init() {
  try { await MAY_AI.cargar(); } catch (e) { console.warn(e); }
  try {
    const r = await fetch("recursos_ccaa.json");
    if (r.ok) ccaaDatos = await r.json();
  } catch (e) {}
  inyectarGoat();
  mostrarContadores();
  pintarAcceso();
})();

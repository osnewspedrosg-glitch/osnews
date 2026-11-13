/**
 * Optional Gemini panel for Azum.
 * The published site never calls Google. A loopback bridge is contacted only
 * when this page itself is opened from 127.0.0.1 or localhost.
 */

export function isLoopbackHost(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]";
}

export function panelModel(hostname) {
  const local = isLoopbackHost(hostname);
  return {
    local,
    canSend: local,
    headline: local
      ? "Puente personal en este ordenador. Todavía no es una conexión verificada a Gemini."
      : "No conectado. Este sitio público no llama a Gemini.",
  };
}

export function buildTurnBody({ role, text, history, consent }) {
  return {
    role,
    text,
    history: Array.isArray(history) ? history.slice(-6) : [],
    consent: consent === true,
  };
}

export const BUDGET_NOTICE =
  "Tope local de este puente: 30,00 EUR por mes natural de Madrid. El máximo configurable es 30,00 EUR y solo puede bajarse. Cada llamada se reserva al precio de pago de gemini-2.5-flash: 0,30 USD por millón de tokens de entrada y 2,50 USD por millón de tokens de salida, pensamiento incluido. El puente cuenta 1 USD como 1 EUR y suma un 21 % de margen. Reserva hasta 512 tokens de salida y 1024 de pensamiento antes de llamar. No es un tope de la factura de Google, ni de otras claves, ni de otros proyectos, ni del hosting, ni del IVA real, ni del tipo de cambio del día. El modo de pago sigue apagado.";

export function badgeFor(source) {
  if (source === "gemini-free-tier") {
    return "Texto recibido desde la API de Gemini con el modelo gratuito configurado. Esta pantalla no ha verificado la facturación de la cuenta.";
  }
  if (source === "gemini-error") return "La llamada a Gemini no se completó. No hay paso a un plan de pago.";
  if (source === "mock") return "Simulación del puente. No es Gemini.";
  if (source === "local-safety" || source === "local-policy") return "Respuesta local. No se ha llamado a Gemini.";
  return "Sin respuesta de Gemini";
}

const STYLE_NOTE = "azum-gemini";

export function mount(doc, options = {}) {
  const body = doc.body;
  if (!body || doc.getElementById(STYLE_NOTE)) return doc.getElementById(STYLE_NOTE);
  const location = options.location ?? doc.location ?? globalThis.location;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const model = panelModel(location?.hostname ?? "");
  const section = doc.createElement("section");
  section.id = STYLE_NOTE;
  section.className = STYLE_NOTE;
  section.setAttribute("aria-labelledby", "azum-gemini-title");

  const title = doc.createElement("h2");
  title.id = "azum-gemini-title";
  title.textContent = "Gemini API";
  section.appendChild(title);

  const kicker = doc.createElement("p");
  kicker.className = "azum-gemini-kicker";
  kicker.textContent = "Aparte de la demostración local. El motor de arriba sigue sin red.";
  section.appendChild(kicker);

  const state = doc.createElement("p");
  state.className = "azum-gemini-state";
  state.dataset.state = "closed";
  state.textContent = model.headline;
  section.appendChild(state);

  for (const line of [
    "La demostración local (Leer en local) no cambia y no envía el texto.",
    "Una suscripción de consumo Gemini Plus no es crédito de la API.",
    "Pagos, Money Bank y planes de suscripción siguen desconectados.",
    BUDGET_NOTICE,
    "Si quien usa el puente está en el EEE, Suiza o el Reino Unido, las condiciones de la API solo permiten Paid Services para ese uso. Este puente no activa facturación y por eso se queda cerrado.",
  ]) {
    const p = doc.createElement("p");
    p.textContent = line;
    if (line === BUDGET_NOTICE) p.dataset.budgetNotice = "true";
    section.appendChild(p);
  }

  const form = doc.createElement("form");
  form.addEventListener("submit", (event) => event.preventDefault());

  const consentLabel = doc.createElement("label");
  consentLabel.className = "azum-gemini-consent";
  const consent = doc.createElement("input");
  consent.type = "checkbox";
  consent.id = "azum-gemini-consent";
  consent.disabled = !model.canSend;
  const consentText = doc.createElement("span");
  consentText.textContent =
    "Envío voluntario: acepto transmitir este turno, y los turnos ya enviados en este panel, a Google Gemini a través del puente de este ordenador. El puente no guarda el chat. En la cuota gratuita, fuera del EEE, Suiza y el Reino Unido, Google puede usar el contenido para mejorar sus productos y personas revisoras pueden leerlo. No escribas datos sensibles. Esto no es un servicio sanitario ni de pagos.";
  consentLabel.append(consent, consentText);

  const gateLabel = doc.createElement("label");
  gateLabel.className = "azum-gemini-field";
  const gateCaption = doc.createElement("span");
  gateCaption.textContent = "Contraseña del puente local (no es la clave de Gemini)";
  const gate = doc.createElement("input");
  gate.type = "password";
  gate.id = "azum-gemini-gate";
  gate.autocomplete = "off";
  gate.spellcheck = false;
  gate.disabled = !model.canSend;
  gateLabel.append(gateCaption, gate);

  const actions = doc.createElement("div");
  actions.className = "azum-gemini-actions";
  const check = doc.createElement("button");
  check.type = "button";
  check.id = "azum-gemini-check";
  check.textContent = "Comprobar puente";
  check.disabled = !model.canSend;
  const send = doc.createElement("button");
  send.type = "button";
  send.id = "azum-gemini-send";
  send.textContent = "Enviar este turno a Gemini";
  send.disabled = !model.canSend;
  actions.append(check, send);

  const reply = doc.createElement("div");
  reply.id = "azum-gemini-reply";
  reply.setAttribute("aria-live", "polite");

  form.append(consentLabel, gateLabel, actions);
  section.append(form, reply);
  body.appendChild(section);

  const history = [];

  function show(message, source) {
    reply.replaceChildren();
    const badge = doc.createElement("p");
    badge.className = "azum-gemini-badge";
    badge.textContent = badgeFor(source);
    const bodyText = doc.createElement("p");
    bodyText.textContent = message;
    reply.append(badge, bodyText);
  }

  async function probe() {
    if (!model.canSend) {
      show("Desde el sitio público no se comprueba ni se llama a ningún puente.", "local-policy");
      return;
    }
    try {
      const response = await fetchImpl("/api/azum/gemini/status", { headers: { accept: "application/json" } });
      const status = await response.json();
      const allowed = status?.callAllowed === true && status?.mode === "free" && status?.freeTierConfirmed === true && status?.verifiedAccount === false;
      state.dataset.state = allowed ? "ready" : status?.mode === "mock" ? "mock" : "closed";
      const budgetLine = section.querySelector("[data-budget-notice]");
      if (budgetLine && status?.budget?.notice) budgetLine.textContent = status.budget.notice;
      state.textContent = allowed
        ? "El puente local permite llamar a gemini-2.5-flash. La cuenta de Google no está verificada desde aquí. No hay plan de pago. El tope local no es la factura de Google."
        : status?.mode === "mock"
          ? "Simulación del puente. No se llama a Gemini."
          : "El puente responde, pero la llamada a Gemini sigue cerrada. " + (status?.reasons || []).join(", ");
    } catch {
      state.dataset.state = "closed";
      state.textContent = "El puente local no responde. Gemini no está conectado.";
    }
  }

  check.addEventListener("click", () => {
    probe().catch(() => show("No se pudo comprobar el puente.", "local-policy"));
  });

  send.addEventListener("click", async () => {
    if (!model.canSend) {
      show("Este sitio público no envía el turno.", "local-policy");
      return;
    }
    if (!consent.checked) {
      show("Falta el consentimiento. No se ha enviado nada.", "local-policy");
      return;
    }
    const box = doc.querySelector(".app textarea");
    if (box && typeof box.blur === "function") box.blur();
    const text = box?.value?.trim() ?? "";
    const role = doc.querySelector(".app select")?.value || "core";
    if (!text) {
      show("Escribe un turno en la demostración local antes de enviarlo.", "local-policy");
      return;
    }
    send.disabled = true;
    try {
      const response = await fetchImpl("/api/azum/gemini/turn", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + gate.value,
        },
        body: JSON.stringify(buildTurnBody({ role, text, history, consent: true })),
      });
      const payload = await response.json();
      const source = payload?.source || "local-policy";
      show(payload?.text || "El puente no devolvió un mensaje.", source);
      if (payload?.ok && (source === "mock" || source === "gemini-free-tier")) {
        history.push({ role: "user", text });
        history.push({ role: "model", text: payload.text });
        while (history.length > 6) history.shift();
      }
    } catch {
      show("El puente local no responde. La demostración local sigue disponible. Gemini no está conectado.", "local-policy");
    } finally {
      send.disabled = false;
    }
  });

  return section;
}

if (typeof document !== "undefined") {
  const start = () => mount(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  const observer = new MutationObserver(() => {
    if (!document.getElementById(STYLE_NOTE)) start();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

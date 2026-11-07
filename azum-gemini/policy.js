import { budgetTerms, parseCapEurMicros } from "./budget.js";

/**
 * Gates for a personal, no-cost Gemini call.
 * The live path stays closed unless every free-tier condition is explicit.
 * This module cannot see Google's billing account. It only trusts operator
 * attestations, and it refuses the combinations this project is not allowed to run.
 */

export const FREE_MODEL = "gemini-2.5-flash";

const BLOCKED_REGIONS = new Set([
  "eea",
  "eu",
  "ch",
  "che",
  "uk",
  "gb",
  "gbr",
  "switzerland",
  "united kingdom",
  "españa",
  "espana",
  "spain",
  "at",
  "be",
  "bg",
  "hr",
  "cy",
  "cz",
  "dk",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "hu",
  "ie",
  "is",
  "it",
  "li",
  "lt",
  "lu",
  "lv",
  "mt",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "se",
  "si",
  "sk",
  "es",
]);

function truthyPaid(value) {
  return /^(1|true|yes|on)$/i.test(String(value ?? "").trim());
}

export function clampLimit(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function evaluatePolicy(env = {}) {
  const requestedMode = String(env.AZUM_GEMINI_MODE ?? "closed").trim().toLowerCase();
  const requestedBind = String(env.AZUM_BIND ?? "127.0.0.1").trim();
  const bind = requestedBind === "::1" ? "::1" : "127.0.0.1";
  const model = String(env.GEMINI_MODEL ?? FREE_MODEL).trim() || FREE_MODEL;
  const billing = String(env.GEMINI_BILLING_LINKED ?? "").trim().toLowerCase();
  const confirmed = String(env.GEMINI_FREE_TIER_CONFIRMED ?? "").trim().toLowerCase();
  const region = String(env.AZUM_OPERATOR_REGION ?? "").trim().toLowerCase();
  const key = String(env.GEMINI_API_KEY ?? "");
  const gate = String(env.AZUM_GATE_SECRET ?? "");
  const cap = parseCapEurMicros(env.AZUM_MONTHLY_BUDGET_EUR);
  const ledgerPath = String(env.AZUM_BUDGET_LEDGER ?? "").trim();
  const paidRequested =
    requestedMode === "paid" ||
    truthyPaid(env.AZUM_PAID_MODE) ||
    truthyPaid(env.AZUM_PAID_SETUP_APPROVED) ||
    truthyPaid(env.AZUM_SPEND_CONTROLS_CONFIRMED);
  const reasons = [];

  if (!["127.0.0.1", "::1"].includes(requestedBind)) reasons.push("public-bind-forbidden");
  if (model !== FREE_MODEL) reasons.push("model-not-on-free-allowlist");
  if (truthyPaid(env.AZUM_ALLOW_PAID)) reasons.push("paid-fallback-forbidden");
  if (paidRequested) reasons.push("paid-activation-pending");
  if (!cap.ok) reasons.push(cap.reason);

  const base = {
    bind,
    model: FREE_MODEL,
    requestedModel: model,
    billingLinked: billing === "yes",
    freeTierConfirmed: false,
    paidFallback: false,
    chatStored: false,
    region: region || null,
    rpm: clampLimit(env.AZUM_RPM, 5, 1, 10),
    rpd: clampLimit(env.AZUM_RPD, 30, 1, 50),
    timeoutMs: clampLimit(env.AZUM_UPSTREAM_TIMEOUT_MS, 15000, 200, 20000),
    capEurMicros: cap.ok ? cap.micros : null,
    ledgerPath,
    paidMode: "disabled",
    paidActivation: "pending",
    accountWideHardEurCap: false,
  };

  if (requestedMode === "mock") {
    return {
      ...base,
      ok: reasons.length === 0,
      mode: reasons.length === 0 ? "mock" : "closed",
      live: false,
      reasons,
    };
  }

  if (requestedMode !== "free") {
    reasons.push(
      requestedMode === "closed" || requestedMode === ""
        ? "mode-closed"
        : requestedMode === "paid"
          ? "paid-mode-disabled"
          : "unknown-mode"
    );
    return { ...base, ok: false, mode: "closed", live: false, reasons };
  }

  if (!ledgerPath) reasons.push("budget-ledger-required");

  if (!key.trim()) reasons.push("missing-api-key");
  if (confirmed !== "yes") reasons.push("free-tier-not-confirmed");
  if (billing !== "no") reasons.push("billing-not-explicitly-unlinked");
  if (!region) reasons.push("operator-region-unknown");
  else if (BLOCKED_REGIONS.has(region)) reasons.push("eea-ch-uk-paid-services-only");
  if (gate.length < 16) reasons.push("gate-secret-too-short");

  const ok = reasons.length === 0;
  return {
    ...base,
    ok,
    mode: ok ? "free" : "closed",
    live: ok,
    freeTierConfirmed: ok,
    reasons,
  };
}

export function publicStatus(policy) {
  return {
    service: "azum-gemini",
    connected: false,
    verifiedAccount: false,
    callAllowed: policy.live === true,
    live: false,
    mode: policy.mode,
    model: FREE_MODEL,
    freeTierConfirmed: policy.freeTierConfirmed === true,
    billingLinked: policy.billingLinked === true,
    paidFallback: false,
    paidMode: "disabled",
    paidActivation: "pending",
    accountWideHardEurCap: false,
    chatStored: false,
    reasons: policy.reasons,
    budget: budgetTerms(policy.capEurMicros ?? 30_000_000n),
  };
}

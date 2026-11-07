/**
 * Per-process monthly ledger for this bridge only.
 * It is not a Google invoice cap, not an account cap, and not a hosting cap.
 * Prices are the published paid list price of gemini-2.5-flash, in USD,
 * counted as if every free-tier call might still be billed.
 */

import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const NOMINAL_CAP_EUR_MICROS = 30_000_000n;
export const MIN_CAP_EUR_MICROS = 10_000n;
export const INPUT_USD_MICROS_PER_MILLION = 300_000n;
export const OUTPUT_USD_MICROS_PER_MILLION = 2_500_000n;
export const FX_EUR_MICROS_PER_USD = 1_000_000n;
export const VAT_NUMERATOR = 121n;
export const VAT_DENOMINATOR = 100n;
export const MAX_OUTPUT_TOKENS = 512n;
export const THINKING_RESERVE_TOKENS = 1024n;
export const TIMEZONE = "Europe/Madrid";

export function noticeFor(capMicros) {
  const amount = formatEurMicros(capMicros).replace(/,(\d{2})\d{4}$/, ",$1");
  return `Tope local de este puente: ${amount} EUR por mes natural de Madrid. El máximo configurable es 30,00 EUR y solo puede bajarse. Cada llamada se reserva al precio de pago de gemini-2.5-flash: 0,30 USD por millón de tokens de entrada y 2,50 USD por millón de tokens de salida, pensamiento incluido. El puente cuenta 1 USD como 1 EUR y suma un 21 % de margen. Reserva hasta 512 tokens de salida y 1024 de pensamiento antes de llamar. No es un tope de la factura de Google, ni de otras claves, ni de otros proyectos, ni del hosting, ni del IVA real, ni del tipo de cambio del día. El modo de pago sigue apagado.`;
}

export const USER_FACING_LIMIT = noticeFor(NOMINAL_CAP_EUR_MICROS);

function ceilDiv(numerator, denominator) {
  return (numerator + denominator - 1n) / denominator;
}

export function formatEurMicros(micros) {
  const value = BigInt(micros);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / 1_000_000n;
  const frac = (abs % 1_000_000n).toString().padStart(6, "0");
  return `${negative ? "-" : ""}${whole},${frac}`;
}

export function parseCapEurMicros(raw) {
  if (raw == null || String(raw).trim() === "") return { ok: true, micros: NOMINAL_CAP_EUR_MICROS };
  const text = String(raw).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return { ok: false, reason: "budget-amount-invalid" };
  const [whole, frac = ""] = text.split(".");
  const micros = BigInt(whole) * 1_000_000n + BigInt((frac + "00").slice(0, 2)) * 10_000n;
  if (micros < MIN_CAP_EUR_MICROS) return { ok: false, reason: "budget-amount-invalid" };
  if (micros > NOMINAL_CAP_EUR_MICROS) return { ok: false, reason: "budget-above-nominal-30" };
  return { ok: true, micros };
}

export function periodKey(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw Object.assign(new Error("budget-clock"), { code: "budget-ledger-unavailable" });
  return `${year}-${month}`;
}

export function eurMicrosForTokens({ inputTokens, outputTokens, thinkingTokens }) {
  const input = BigInt(inputTokens);
  const output = BigInt(outputTokens);
  const thinking = BigInt(thinkingTokens);
  if (input < 0n || output < 0n || thinking < 0n) {
    throw Object.assign(new Error("budget-usage"), { code: "budget-ledger-unavailable" });
  }
  const usd =
    ceilDiv(input * INPUT_USD_MICROS_PER_MILLION, 1_000_000n) +
    ceilDiv((output + thinking) * OUTPUT_USD_MICROS_PER_MILLION, 1_000_000n);
  const eur = ceilDiv(usd * FX_EUR_MICROS_PER_USD, 1_000_000n);
  return ceilDiv(eur * VAT_NUMERATOR, VAT_DENOMINATOR);
}

export function estimateReservationMicros({ system, contents }) {
  let chars = String(system ?? "").length;
  for (const turn of contents ?? []) {
    for (const part of turn?.parts ?? []) chars += String(part?.text ?? "").length;
  }
  const inputTokens = ceilDiv(BigInt(chars), 2n);
  return eurMicrosForTokens({
    inputTokens,
    outputTokens: MAX_OUTPUT_TOKENS,
    thinkingTokens: THINKING_RESERVE_TOKENS,
  });
}

function fail(code) {
  return Object.assign(new Error(code), { code });
}

function countedMicros(entries) {
  let total = 0n;
  for (const entry of entries) {
    let reserved;
    let settled;
    try {
      reserved = BigInt(entry.reservedEurMicros);
      settled = entry.settledEurMicros == null ? null : BigInt(entry.settledEurMicros);
    } catch {
      throw fail("budget-ledger-corrupt");
    }
    if (reserved < 0n || (settled != null && settled < 0n)) throw fail("budget-ledger-corrupt");
    if (entry.state === "pending") total += reserved;
    else if (entry.state === "settled" || entry.state === "kept") {
      if (settled == null) throw fail("budget-ledger-corrupt");
      total += settled;
    } else {
      throw fail("budget-ledger-corrupt");
    }
  }
  return total;
}

function readLedger(file, period) {
  if (!fs.existsSync(file)) {
    return { version: 1, period, timezone: TIMEZONE, entries: [], history: [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw fail("budget-ledger-corrupt");
  }
  if (parsed?.version !== 1 || !Array.isArray(parsed.entries) || parsed.timezone !== TIMEZONE) {
    throw fail("budget-ledger-corrupt");
  }
  if (!Array.isArray(parsed.history)) parsed.history = [];
  if (parsed.period !== period) {
    const spent = countedMicros(parsed.entries);
    const history = parsed.history.slice(-12);
    history.push({ period: parsed.period, spentEurMicros: spent.toString() });
    return { version: 1, period, timezone: TIMEZONE, entries: [], history };
  }
  countedMicros(parsed.entries);
  return parsed;
}

function writeLedger(file, ledger) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(ledger), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLock(file, fn) {
  const lockDir = `${file}.lock`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const deadline = Date.now() + 3000;
  while (true) {
    try {
      fs.mkdirSync(lockDir);
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw fail("budget-ledger-unavailable");
      try {
        const stat = fs.statSync(lockDir);
        if (Date.now() - stat.mtimeMs > 15_000) fs.rmdirSync(lockDir);
      } catch {
        /* another process removed it */
      }
      if (Date.now() > deadline) throw fail("budget-lock-timeout");
      await sleep(5);
    }
  }
  try {
    return await fn();
  } finally {
    try {
      fs.rmdirSync(lockDir);
    } catch {
      /* the next caller treats a stale lock as unavailable until it expires */
    }
  }
}

export function budgetTerms(capMicros) {
  return {
    scope: "this-process",
    guaranteesInvoice: false,
    guaranteesOtherKeys: false,
    guaranteesOtherProjects: false,
    includesHosting: false,
    includesActualTax: false,
    includesLiveFx: false,
    accountWideHardEurCap: false,
    paidMode: "disabled",
    paidActivation: "pending",
    currency: "EUR",
    nominalCapEur: "30.00",
    configuredCapEurMicros: capMicros.toString(),
    configuredCapEur: formatEurMicros(capMicros).replace(/,(\d{2})\d{4}$/, ",$1"),
    timezone: TIMEZONE,
    inputUsdPerMillion: "0.30",
    outputAndThinkingUsdPerMillion: "2.50",
    fxAssumptionEurPerUsd: "1.00",
    vatBuffer: "0.21",
    maxOutputTokens: Number(MAX_OUTPUT_TOKENS),
    thinkingReserveTokens: Number(THINKING_RESERVE_TOKENS),
    notice: noticeFor(capMicros),
  };
}

export async function readBudget(file, capMicros, now = () => new Date()) {
  return withLock(file, async () => {
    const ledger = readLedger(file, periodKey(now()));
    const counted = countedMicros(ledger.entries);
    writeLedger(file, ledger);
    return snapshot(ledger, capMicros, counted);
  });
}

function snapshot(ledger, capMicros, counted) {
  const remaining = capMicros > counted ? capMicros - counted : 0n;
  return {
    ...budgetTerms(capMicros),
    readable: true,
    period: ledger.period,
    countedEurMicros: counted.toString(),
    countedEur: formatEurMicros(counted),
    remainingEurMicros: remaining.toString(),
    remainingEur: formatEurMicros(remaining),
  };
}

export async function reserveBudget({ file, capMicros, amountMicros, now = () => new Date() }) {
  const amount = BigInt(amountMicros);
  if (amount <= 0n) throw fail("budget-ledger-unavailable");
  return withLock(file, async () => {
    const ledger = readLedger(file, periodKey(now()));
    const counted = countedMicros(ledger.entries);
    if (counted + amount > capMicros) {
      writeLedger(file, ledger);
      throw Object.assign(fail("local-budget-reached"), {
        countedEurMicros: counted.toString(),
        capEurMicros: capMicros.toString(),
      });
    }
    const id = randomBytes(16).toString("hex");
    ledger.entries.push({
      id,
      at: now().toISOString(),
      reservedEurMicros: amount.toString(),
      state: "pending",
    });
    writeLedger(file, ledger);
    return { id, reservedEurMicros: amount.toString(), ...snapshot(ledger, capMicros, counted + amount) };
  });
}

export async function settleBudget({ file, capMicros, id, usage, now = () => new Date() }) {
  return withLock(file, async () => {
    const ledger = readLedger(file, periodKey(now()));
    const entry = ledger.entries.find((item) => item.id === id);
    if (!entry || entry.state !== "pending") throw fail("budget-ledger-corrupt");
    const reserved = BigInt(entry.reservedEurMicros);
    let settled = reserved;
    let known = false;
    if (usage) {
      const actual = eurMicrosForTokens(usage);
      const tokens = BigInt(usage.inputTokens) + BigInt(usage.outputTokens) + BigInt(usage.thinkingTokens);
      if (actual > 0n && tokens > 0n) {
        settled = actual;
        known = true;
      }
    }
    entry.state = known ? "settled" : "kept";
    entry.settledEurMicros = settled.toString();
    writeLedger(file, ledger);
    const counted = countedMicros(ledger.entries);
    return snapshot(ledger, capMicros, counted);
  });
}

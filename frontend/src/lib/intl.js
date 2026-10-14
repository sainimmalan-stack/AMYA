// AMYA international checkout helpers: countries, parcel weight, shipping rules, FX estimates.
// Rules are exactly as confirmed by the founder. Anything unconfirmed returns a "quote required".

export const COUNTRIES = [
  { code: "IN", name: "India", region: "IN", currency: "INR", symbol: "₹", dial: "+91", stateLabel: "State", postalLabel: "PIN code", postalRe: /^\d{6}$/, postalHint: "6-digit PIN" },
  { code: "US", name: "United States", region: "US", currency: "USD", symbol: "$", dial: "+1", stateLabel: "State", postalLabel: "ZIP code", postalRe: /^\d{5}(-\d{4})?$/, postalHint: "5-digit ZIP" },
  { code: "GB", name: "United Kingdom", region: "UK", currency: "GBP", symbol: "£", dial: "+44", stateLabel: "County", postalLabel: "Postcode", postalRe: /^[A-Za-z0-9 ]{4,8}$/, postalHint: "e.g. SW1A 1AA" },
  { code: "AU", name: "Australia", region: "AU", currency: "AUD", symbol: "A$", dial: "+61", stateLabel: "State / Territory", postalLabel: "Postcode", postalRe: /^\d{4}$/, postalHint: "4-digit postcode" },
  // European countries (EUR). Shipping rates not supplied -> quote required.
  ...[
    ["FR", "France", "+33"], ["DE", "Germany", "+49"], ["IT", "Italy", "+39"], ["ES", "Spain", "+34"],
    ["NL", "Netherlands", "+31"], ["IE", "Ireland", "+353"], ["BE", "Belgium", "+32"], ["PT", "Portugal", "+351"],
    ["AT", "Austria", "+43"], ["SE", "Sweden", "+46"], ["DK", "Denmark", "+45"], ["FI", "Finland", "+358"],
    ["PL", "Poland", "+48"], ["GR", "Greece", "+30"], ["CZ", "Czechia", "+420"],
  ].map(([code, name, dial]) => ({
    code, name, region: "EU", currency: "EUR", symbol: "€", dial,
    stateLabel: "Region / Province", postalLabel: "Postal code", postalRe: /^[A-Za-z0-9 -]{3,10}$/, postalHint: "Postal code",
  })),
];

export const countryByCode = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

// Parse a pack label like "500 g", "250g", "1 kg", "2kg" -> weight in kg. Unknown -> 0.5 kg.
export function packWeightKg(label) {
  if (!label) return 0.5;
  const m = String(label).toLowerCase().match(/([\d.]+)\s*(kg|g|gm|gms|gram|grams)?/);
  if (!m) return 0.5;
  const n = parseFloat(m[1]);
  if (!n) return 0.5;
  const unit = m[2] || "g";
  return unit.startsWith("kg") ? n : n / 1000;
}

export const cartWeightKg = (items) =>
  items.reduce((sum, it) => sum + packWeightKg(it.packLabel) * (it.qty || 1), 0);

export const roundUpHalfKg = (kg) => Math.max(0.5, Math.ceil(kg / 0.5) * 0.5);
// Courier bills per whole kilogram for per-kg international tiers (minimum 1 kg).
export const billableWholeKg = (kg) => Math.max(1, Math.ceil(kg || 0));

const shipOk = (amount, billableKg, ratePerKg, rateLabel, note) => ({ status: "ok", amount, billableKg, ratePerKg, rateLabel, note });
const shipQuote = (note, billableKg) => ({ status: "quote", amount: null, billableKg, ratePerKg: null, rateLabel: "Quote required", note });

// Returns { status: 'ok'|'quote', amount: number|null (INR), billableKg, ratePerKg: number|null, rateLabel, note }.
// Rates below are EXACTLY as confirmed by the founder. Anything unconfirmed returns a quote.
export function computeShipping(region, postcode, weightKg) {
  const raw = Math.max(0, weightKg || 0);

  if (region === "IN") {
    const w = roundUpHalfKg(raw);
    const pin = (postcode || "").trim();
    if (!/^\d{6}$/.test(pin)) return shipQuote("Enter a valid 6-digit PIN to see shipping.", w);
    if (["5000", "5001"].includes(pin.slice(0, 4))) return shipOk(100, w, null, null, "Hyderabad delivery");
    if (["50", "51", "52", "53"].includes(pin.slice(0, 2))) return shipOk(180, w, null, null, "Andhra Pradesh / Telangana delivery");
    return shipQuote("Please contact AMYA to confirm delivery and shipping charges.", w);
  }

  if (region === "US") {
    // Confirmed: flat slabs up to 9 kg, then 880/kg (10-19), 850/kg (20+).
    const billable = raw <= 0.5 ? 0.5 : billableWholeKg(raw);
    const bands = { 0.5: 2400, 1: 2900, 2: 3400, 3: 4300, 4: 5000, 5: 5800, 6: 6500, 7: 7000, 8: 7800, 9: 8200 };
    if (billable <= 9) return shipOk(bands[billable], billable, null, "Weight slab (0.5-9 kg)", "USA delivery · you'll be charged in INR");
    if (billable < 20) return shipOk(880 * billable, billable, 880, "₹880 per kg", "USA delivery · you'll be charged in INR");
    return shipOk(850 * billable, billable, 850, "₹850 per kg", "USA delivery · you'll be charged in INR");
  }

  if (region === "UK") {
    // Confirmed: 5-9 kg @ 850/kg, 10-19 kg @ 650/kg. Under 5 kg and 20 kg+ not confirmed.
    const billable = billableWholeKg(raw);
    if (billable >= 20) return shipQuote("20 kg+ rate pending confirmation — shipping quote required.", billable);
    if (billable >= 10) return shipOk(650 * billable, billable, 650, "₹650 per kg", "UK delivery · you'll be charged in INR");
    if (billable >= 5) return shipOk(850 * billable, billable, 850, "₹850 per kg", "UK delivery · you'll be charged in INR");
    return shipQuote("Under 5 kg — shipping quote required.", billable);
  }

  if (region === "AU") {
    // Australia rate not confirmed — always a quote, never a carried-over charge.
    return shipQuote("Australia shipping rate not confirmed — quote required.", billableWholeKg(raw));
  }

  // EU and anything else — not confirmed.
  return shipQuote("International shipping rate: Quote required.", billableWholeKg(raw));
}

// --- FX estimates (never hard-coded; cached with a visible date) ---
const FX_KEY = "amya_fx_inr";
const FX_TTL_MS = 6 * 60 * 60 * 1000; // 6h

export async function getFxRates() {
  try {
    const cached = JSON.parse(localStorage.getItem(FX_KEY) || "null");
    if (cached && Date.now() - cached.ts < FX_TTL_MS && cached.rates) return cached;
  } catch { /* ignore */ }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/INR");
    const data = await res.json();
    if (data && data.result === "success" && data.rates) {
      const payload = { rates: data.rates, date: data.time_last_update_utc || new Date().toUTCString(), ts: Date.now() };
      try { localStorage.setItem(FX_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
      return payload;
    }
  } catch { /* ignore */ }
  try {
    const cached = JSON.parse(localStorage.getItem(FX_KEY) || "null");
    if (cached && cached.rates) return { ...cached, stale: true };
  } catch { /* ignore */ }
  return null;
}

export function convertFromInr(amountInr, currency, fx) {
  if (!fx || !fx.rates || currency === "INR") return null;
  const rate = fx.rates[currency];
  if (!rate) return null;
  return amountInr * rate;
}

export const fmtMoney = (amount, currency, symbol) =>
  `${symbol}${Number(amount).toLocaleString(currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: currency === "INR" ? 0 : 2 })}`;

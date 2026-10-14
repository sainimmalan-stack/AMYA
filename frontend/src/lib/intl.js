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

// Returns { status: 'ok' | 'quote', amount: number|null, note: string } — amount is INR.
export function computeShipping(region, postcode, weightKg) {
  const w = roundUpHalfKg(weightKg);
  if (region === "IN") {
    const pin = (postcode || "").trim();
    if (!/^\d{6}$/.test(pin)) return { status: "quote", amount: null, note: "Enter a valid 6-digit PIN to see shipping." };
    if (["5000", "5001"].includes(pin.slice(0, 4))) return { status: "ok", amount: 100, note: "Hyderabad delivery" };
    if (["50", "51", "52", "53"].includes(pin.slice(0, 2))) return { status: "ok", amount: 180, note: "Andhra Pradesh / Telangana delivery" };
    return { status: "quote", amount: null, note: "Please contact AMYA to confirm delivery and shipping charges." };
  }
  if (region === "US") {
    const bands = [[0.5, 2400], [1, 2900], [2, 3400], [3, 4300], [4, 5000], [5, 5800], [6, 6500], [7, 7000], [8, 7800], [9, 8200], [10, 8800]];
    for (const [max, price] of bands) if (w <= max) {
      return { status: "ok", amount: price, note: max === 10 ? `Parcel ${w} kg · rate subject to confirmation` : `Parcel ${w} kg` };
    }
    return { status: "quote", amount: null, note: "Above 10 kg — shipping quote required." };
  }
  if (region === "UK") {
    if (w >= 20) return { status: "quote", amount: null, note: "20 kg+ rate pending confirmation — quote required." };
    if (w >= 10) return { status: "ok", amount: Math.round(650 * w), note: `Parcel ${w} kg @ ₹650/kg` };
    if (w >= 5) return { status: "ok", amount: Math.round(850 * w), note: `Parcel ${w} kg @ ₹850/kg` };
    return { status: "quote", amount: null, note: "Under 5 kg — shipping quote required." };
  }
  if (region === "AU") {
    // Metro eligibility cannot be verified from a postcode list -> always quote.
    return { status: "quote", amount: null, note: "Australia delivery — metro eligibility & quote required." };
  }
  // EU and anything else
  return { status: "quote", amount: null, note: "International shipping quote required." };
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

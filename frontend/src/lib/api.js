import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// WhatsApp click-to-chat helper
export function waLink(number, message) {
  const n = String(number).replace(/[^0-9]/g, "");
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// Prefilled order/enquiry message for a product
export function orderMessage(product, packLabel, price, qty) {
  const available = product.availability === "available";
  const head = available ? "I'd like to order" : "I'd like to enquire about";
  const priceStr = price != null ? ` (₹${price})` : "";
  const sizeStr = packLabel ? ` — ${packLabel}${priceStr}` : "";
  const qtyStr = qty ? ` × ${qty}` : "";
  return (
    `Hello AMYA, ${head}:\n` +
    `• ${product.name}${sizeStr}${qtyStr}\n\n` +
    (available
      ? "Please confirm availability, delivery and payment."
      : "Please let me know when it's available and the price.")
  );
}

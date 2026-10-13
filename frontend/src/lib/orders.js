// Shared order-status taxonomy, formatting and revenue logic for the AMYA admin dashboard.

export const ORDER_STATUS = {
  placed: { label: "New", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "blue" },
  preparing: { label: "Preparing", tone: "violet" },
  ready_to_dispatch: { label: "Ready to dispatch", tone: "indigo" },
  shipped: { label: "Shipped", tone: "teal" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export const PAYMENT_STATUS = {
  cod_pending: { label: "COD — awaiting", tone: "amber" },
  cod_collected: { label: "COD collected", tone: "green" },
  pending: { label: "Payment pending", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  failed: { label: "Payment failed", tone: "red" },
  refund_processing: { label: "Refund processing", tone: "violet" },
  refunded: { label: "Refunded", tone: "red" },
};

// Order lifecycle buttons shown on the detail page, in sequence.
export const LIFECYCLE = ["placed", "confirmed", "preparing", "ready_to_dispatch", "shipped", "delivered"];

export const TONE = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  gray: "bg-ink/5 text-ink-soft border-ink/15",
};

export const orderStatusMeta = (s) => ORDER_STATUS[s] || { label: s || "—", tone: "gray" };
export const paymentStatusMeta = (s) => PAYMENT_STATUS[s] || { label: s || "—", tone: "gray" };

export const inr = (n) => (n == null ? "To be confirmed" : `₹${Number(n).toLocaleString("en-IN")}`);

export const paymentMethodLabel = (m) => (m === "razorpay" ? "Online (Razorpay)" : "Cash on Delivery");

// Revenue is only money actually collected: verified online payments + collected COD,
// and never from cancelled orders. Pending / failed / refunded are excluded.
export const isRevenueOrder = (o) =>
  o.order_status !== "cancelled" && ["paid", "cod_collected"].includes(o.payment_status);

export const revenueOf = (orders) =>
  orders.filter(isRevenueOrder).reduce((sum, o) => sum + (o.total == null ? 0 : Number(o.total)), 0);

export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// Inclusive date-range check against an order's created_at (ISO).
export function withinRange(iso, from, to) {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (from) {
    if (t < new Date(`${from}T00:00:00`).getTime()) return false;
  }
  if (to) {
    if (t > new Date(`${to}T23:59:59`).getTime()) return false;
  }
  return true;
}

export const itemsSummary = (o) => {
  const items = o.items || [];
  if (!items.length) return "—";
  const first = `${items[0].name}${items[0].pack_label ? ` · ${items[0].pack_label}` : ""} × ${items[0].qty}`;
  return items.length > 1 ? `${first} +${items.length - 1} more` : first;
};

// Build a full-detail CSV from a list of orders (every spec field, no double counting).
export function ordersToCSV(orders) {
  const headers = [
    "Order ID", "Order Date", "Customer Name", "Phone", "Email", "Delivery Address",
    "Items", "Subtotal", "Delivery Charge", "GST", "Total Payable",
    "Payment Method", "Payment Status", "Order Status", "Tracking Reference",
    "Razorpay Order ID", "Razorpay Payment ID", "Counts as Revenue",
  ];
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = orders.map((o) => {
    const c = o.customer || {};
    const itemsStr = (o.items || [])
      .map((it) => `${it.name}${it.pack_label ? ` (${it.pack_label})` : ""} x${it.qty} @ ${it.unit_price ?? "NA"} = ${it.line_total ?? "NA"}`)
      .join(" | ");
    return [
      o.order_number, formatDateTime(o.created_at), c.name, c.mobile, c.email || "",
      (c.address || "").replace(/\n/g, ", "), itemsStr, o.subtotal ?? "", o.delivery_charge ?? "",
      o.gst_amount ?? "", o.total_pending ? "To be confirmed" : (o.total ?? ""),
      paymentMethodLabel(o.payment_method), paymentStatusMeta(o.payment_status).label,
      orderStatusMeta(o.order_status).label, o.tracking_reference || "",
      o.razorpay_order_id || "", o.razorpay_payment_id || "", isRevenueOrder(o) ? "Yes" : "No",
    ].map(esc).join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

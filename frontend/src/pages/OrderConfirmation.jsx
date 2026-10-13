import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Download, MessageCircle, Loader2 } from "lucide-react";
import { api, API, waLink } from "@/lib/api";

const inr = (n) => (n == null ? "To be confirmed" : `₹${Number(n).toLocaleString("en-IN")}`);
const WA_NUMBER = "919675334567";

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/orders/${orderNumber}?token=${encodeURIComponent(token)}`)
      .then(({ data }) => setOrder(data)).catch(() => setError(true));
  }, [orderNumber, token]);

  if (error) return (
    <div className="max-w-3xl mx-auto px-5 py-28 text-center">
      <h1 className="font-serif text-3xl text-ink">Order not found</h1>
      <Link to="/shop" className="link-underline inline-block mt-6 font-sans text-xs uppercase tracking-[0.18em] text-terracotta">Back to shop</Link>
    </div>
  );
  if (!order) return <div className="py-40 text-center font-sans text-ink-soft"><Loader2 className="animate-spin inline" /></div>;

  const invoiceUrl = `${API}/orders/${order.order_number}/invoice?token=${encodeURIComponent(token)}`;
  const waMsg = [
    "Hello AMYA! I've just placed an order on your website.",
    "", `Order number: ${order.order_number}`, "", "My Order:",
    ...order.items.map((it, i) => `${i + 1}. ${it.name}${it.pack_label ? ` (${it.pack_label})` : ""} × ${it.qty}`),
    "", `Order total: ${order.total_pending ? "To be confirmed" : inr(order.total)}`,
    "", "Please confirm availability, delivery and the final amount. Thank you!",
  ].join("\n");

  return (
    <div data-testid="order-confirmation">
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 lg:py-16">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-terracotta" size={46} />
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight mt-4 text-ink">Thank you for your order!</h1>
          <p className="font-sans text-sm text-ink-soft mt-2">Order <b className="text-ink" data-testid="confirm-order-number">{order.order_number}</b> has been received.</p>
        </div>

        <div className="mt-8 rounded-xl border border-beige bg-ivory-warm p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-terracotta">Order summary</span>
            <span className="font-sans text-[11px] uppercase tracking-[0.14em] rounded-full bg-terracotta text-ivory px-3 py-1" data-testid="confirm-payment-status">COD / Payment Pending</span>
          </div>
          <div className="mt-4 space-y-3">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-beige pb-3">
                <div className="min-w-0">
                  <p className="font-serif text-base text-ink leading-tight">{it.name}</p>
                  {it.pack_label && <p className="font-sans text-xs text-ink-soft mt-0.5">Pack size: {it.pack_label} · Qty {it.qty}</p>}
                </div>
                <div className="font-sans text-sm text-ink whitespace-nowrap">{it.line_total != null ? inr(it.line_total) : "—"}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <span className="font-sans text-sm text-ink-soft">Total payable</span>
            <span className="font-serif text-xl text-terracotta" data-testid="confirm-total">{order.total_pending ? "To be confirmed" : inr(order.total)}</span>
          </div>
          <p className="font-sans text-[11px] text-ink-soft mt-3 leading-relaxed">
            We'll confirm availability, delivery timeline and the final payable amount with you shortly. Delivery charges, if any, are confirmed at that time.
          </p>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <a href={invoiceUrl} target="_blank" rel="noreferrer" data-testid="confirm-download-invoice"
            className="inline-flex items-center justify-center gap-2 border border-terracotta text-terracotta-deep hover:bg-terracotta hover:text-ivory transition-colors py-3.5 font-sans text-xs uppercase tracking-[0.16em] rounded-full">
            <Download size={16} /> Download invoice
          </a>
          <a href={waLink(WA_NUMBER, waMsg)} target="_blank" rel="noreferrer" data-testid="confirm-whatsapp"
            className="inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-3.5 font-sans text-xs uppercase tracking-[0.16em] rounded-full">
            <MessageCircle size={16} /> Confirm on WhatsApp
          </a>
        </div>
        <div className="text-center mt-8">
          <Link to="/shop" className="link-underline font-sans text-xs uppercase tracking-[0.18em] text-ink">Continue shopping</Link>
        </div>
      </section>
    </div>
  );
}

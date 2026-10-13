import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, count, allPriced, grandTotal, orderRef, clear } = useCart();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-28 text-center" data-testid="checkout-empty">
        <ShoppingBag className="mx-auto text-terracotta/40" size={40} />
        <h1 className="font-serif text-3xl text-ink mt-5">Your cart is empty</h1>
        <Link to="/shop" className="link-underline inline-block mt-6 font-sans text-xs uppercase tracking-[0.18em] text-terracotta">Browse the collection</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim() || !form.address.trim()) {
      toast.error("Please fill your name, mobile and delivery address.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        customer_name: form.name.trim(),
        customer_mobile: form.mobile.trim(),
        customer_email: form.email.trim() || null,
        delivery_address: form.address.trim(),
        client_ref: orderRef,
        items: items.map((it) => ({ slug: it.slug, pack_label: it.packLabel, qty: it.qty })),
      });
      clear();
      navigate(`/order/${data.order_number}?token=${encodeURIComponent(data.download_token)}`);
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Could not place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = "block font-sans text-xs uppercase tracking-[0.18em] text-ink-soft mb-1.5";
  const inputCls = "w-full border border-ink/15 rounded-lg bg-ivory px-3.5 py-3 font-sans text-sm text-ink focus:outline-none focus:border-terracotta transition-colors";

  return (
    <div data-testid="checkout-page">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-terracotta" data-testid="checkout-back">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-6 lg:py-12 grid lg:grid-cols-2 gap-8 lg:gap-14">
        {/* Form */}
        <div>
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Checkout</span>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight mt-2 text-ink leading-tight">Your details</h1>
          <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">We'll prepare your order and confirm availability, delivery and the final amount with you. Payment is collected on confirmation / delivery.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" data-testid="checkout-form">
            <div>
              <label className={labelCls} htmlFor="co-name">Full name *</label>
              <input id="co-name" className={inputCls} value={form.name} onChange={set("name")} data-testid="checkout-name" autoComplete="name" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="co-mobile">Mobile number *</label>
                <input id="co-mobile" className={inputCls} value={form.mobile} onChange={set("mobile")} data-testid="checkout-mobile" inputMode="tel" autoComplete="tel" />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-email">Email (for invoice)</label>
                <input id="co-email" type="email" className={inputCls} value={form.email} onChange={set("email")} data-testid="checkout-email" autoComplete="email" />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="co-address">Delivery address *</label>
              <textarea id="co-address" rows={3} className={inputCls} value={form.address} onChange={set("address")} data-testid="checkout-address" autoComplete="street-address" />
            </div>
            <button type="submit" disabled={submitting} data-testid="checkout-submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full disabled:opacity-60">
              {submitting ? <><Loader2 size={17} className="animate-spin" /> Placing order…</> : <>Place order &amp; get invoice</>}
            </button>
            <p className="font-sans text-[11px] text-ink-soft text-center">Payment status: <b>COD / Payment Pending</b>. No online payment is taken now.</p>
          </form>
        </div>

        {/* Summary */}
        <div className="lg:pt-2">
          <div className="rounded-xl border border-beige bg-ivory-warm p-5 sm:p-6" data-testid="checkout-summary">
            <h2 className="font-serif text-xl text-ink">Order summary ({count})</h2>
            <div className="mt-4 space-y-3">
              {items.map((it) => (
                <div key={it.key} className="flex justify-between gap-3 border-b border-beige pb-3" data-testid={`summary-item-${it.slug}`}>
                  <div className="min-w-0">
                    <p className="font-serif text-base text-ink leading-tight">{it.name}</p>
                    {it.packLabel && <p className="font-sans text-xs text-ink-soft mt-0.5">Pack size: {it.packLabel} · Qty {it.qty}</p>}
                  </div>
                  <div className="font-sans text-sm text-ink whitespace-nowrap">{it.price != null ? inr(it.price * it.qty) : "—"}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <span className="font-sans text-sm text-ink-soft">Order total</span>
              <span className="font-serif text-lg text-terracotta" data-testid="checkout-total">{allPriced ? inr(grandTotal) : "To be confirmed"}</span>
            </div>
            <p className="font-sans text-[11px] text-ink-soft mt-3 leading-relaxed">Delivery charges, if any, are confirmed with you on order confirmation.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

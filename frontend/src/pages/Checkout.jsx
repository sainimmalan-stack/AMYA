import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, count, allPriced, grandTotal, orderRef, clear } = useCart();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", city: "", state: "", pin: "" });
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState("cod");
  const [rzp, setRzp] = useState({ enabled: false, key_id: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { api.get("/payments/razorpay/config").then(({ data }) => setRzp(data)).catch(() => {}); }, []);

  const loadRzpScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-28 text-center" data-testid="checkout-empty">
        <ShoppingBag className="mx-auto text-terracotta/40" size={40} />
        <h1 className="font-serif text-3xl text-ink mt-5">Your cart is empty</h1>
        <Link to="/shop" className="link-underline inline-block mt-6 font-sans text-xs uppercase tracking-[0.18em] text-terracotta">Browse the collection</Link>
      </div>
    );
  }

  const goConfirm = (data) => { clear(); navigate(`/order/${data.order_number}?token=${encodeURIComponent(data.download_token)}`); };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return; // guard against duplicate submissions
    const mobile = form.mobile.replace(/\s+/g, "");
    const pin = form.pin.replace(/\s+/g, "");
    if (!form.name.trim()) { toast.error("Please enter your full name."); return; }
    if (!/^\d{10}$/.test(mobile)) { toast.error("Please enter a valid 10-digit mobile number."); return; }
    if (!EMAIL_RE.test(form.email.trim())) { toast.error("Please enter a valid email address."); return; }
    if (!form.address.trim()) { toast.error("Please enter your delivery address."); return; }
    if (!form.city.trim()) { toast.error("Please enter your city."); return; }
    if (!form.state.trim()) { toast.error("Please enter your state."); return; }
    if (!/^\d{6}$/.test(pin)) { toast.error("Please enter a valid 6-digit PIN code."); return; }

    const fullAddress = `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} - ${pin}`;
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        customer_name: form.name.trim(),
        customer_mobile: mobile,
        customer_email: form.email.trim(),
        delivery_address: fullAddress,
        client_ref: orderRef,
        payment_method: method,
        items: items.map((it) => ({ slug: it.slug, pack_label: it.packLabel, qty: it.qty })),
      });
      if (method === "razorpay" && data.razorpay_order_id) {
        const ok = await loadRzpScript();
        if (!ok) { toast.error("Could not load the payment window. Please try Cash on Delivery."); setSubmitting(false); return; }
        const rzpay = new window.Razorpay({
          key: data.razorpay_key_id, amount: data.amount, currency: data.currency || "INR",
          order_id: data.razorpay_order_id, name: "AMYA Artisanal Foods", description: `Order ${data.order_number}`,
          prefill: { name: form.name.trim(), email: form.email.trim(), contact: mobile },
          theme: { color: "#B5643C" },
          handler: async (resp) => {
            try {
              await api.post("/payments/razorpay/verify", {
                order_number: data.order_number, razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature,
              });
            } catch (_) { /* confirmation page shows Payment Pending if verify fails */ }
            goConfirm(data);
          },
          modal: { ondismiss: () => { toast("Payment cancelled — your order is saved as Payment Pending."); goConfirm(data); } },
        });
        rzpay.on("payment.failed", () => toast.error("Payment failed — order saved as Payment Pending."));
        rzpay.open();
        return;
      }
      goConfirm(data);
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Could not place your order. Please try again.");
      setSubmitting(false);
    }
  };

  const labelCls = "block font-sans text-xs uppercase tracking-[0.18em] text-ink-soft mb-1.5";
  const inputCls = "w-full border border-ink/15 rounded-lg bg-ivory px-3.5 py-3 font-sans text-sm text-ink focus:outline-none focus:border-terracotta transition-colors";

  return (
    <div data-testid="checkout-page">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-terracotta" data-testid="checkout-back">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <section className="max-w-2xl mx-auto px-5 sm:px-8 py-6 lg:py-10 space-y-8">
        {/* 1. Checkout heading + introduction */}
        <div>
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Checkout</span>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight mt-2 text-ink leading-tight">Checkout</h1>
          <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">Review your order below, add your delivery details and choose how you'd like to pay.</p>
        </div>

        {/* 2. Order summary — shown first, before details & payment */}
        <div className="rounded-xl border border-beige bg-ivory-warm p-5 sm:p-6" data-testid="checkout-summary">
          <h2 className="font-serif text-xl text-ink">Order summary ({count})</h2>
          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <div key={it.key} className="flex justify-between gap-3 border-b border-beige pb-3" data-testid={`summary-item-${it.slug}`}>
                <div className="min-w-0">
                  <p className="font-serif text-base text-ink leading-tight">{it.name}</p>
                  {it.packLabel && <p className="font-sans text-xs text-ink-soft mt-0.5">Pack size: {it.packLabel} · Qty {it.qty}</p>}
                  {it.price != null && <p className="font-sans text-xs text-ink-soft mt-0.5">{inr(it.price)} each</p>}
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

        <form onSubmit={submit} className="space-y-8" data-testid="checkout-form">
          {/* 3. Your details */}
          <div>
            <h2 className="font-serif text-2xl text-ink">Your details</h2>
            <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">Enter your contact and delivery details so we can prepare your order. Your order total is shown in the order summary above.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className={labelCls} htmlFor="co-name">Full name *</label>
                <input id="co-name" className={inputCls} value={form.name} onChange={set("name")} data-testid="checkout-name" autoComplete="name" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="co-mobile">Mobile number *</label>
                  <input id="co-mobile" className={inputCls} value={form.mobile} onChange={set("mobile")} data-testid="checkout-mobile" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="co-email">Email address *</label>
                  <input id="co-email" type="email" className={inputCls} value={form.email} onChange={set("email")} data-testid="checkout-email" autoComplete="email" />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="co-address">Complete delivery address *</label>
                <textarea id="co-address" rows={3} className={inputCls} value={form.address} onChange={set("address")} data-testid="checkout-address" autoComplete="street-address" placeholder="House / flat, street, area, landmark" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls} htmlFor="co-city">City *</label>
                  <input id="co-city" className={inputCls} value={form.city} onChange={set("city")} data-testid="checkout-city" autoComplete="address-level2" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="co-state">State *</label>
                  <input id="co-state" className={inputCls} value={form.state} onChange={set("state")} data-testid="checkout-state" autoComplete="address-level1" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="co-pin">PIN code *</label>
                  <input id="co-pin" className={inputCls} value={form.pin} onChange={set("pin")} data-testid="checkout-pin" inputMode="numeric" autoComplete="postal-code" placeholder="6-digit PIN" />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Payment method */}
          <div>
            <h2 className="font-serif text-2xl text-ink">Payment method</h2>
            <div className="grid gap-2.5 mt-4">
              {rzp.enabled && allPriced && (
                <label data-testid="pay-razorpay" className={`flex items-center gap-3 border rounded-lg px-3.5 py-3 cursor-pointer transition-colors ${method === "razorpay" ? "border-terracotta bg-terracotta/[0.06]" : "border-ink/15"}`}>
                  <input type="radio" name="pay" checked={method === "razorpay"} onChange={() => setMethod("razorpay")} className="accent-terracotta" />
                  <span><span className="font-sans text-sm text-ink font-medium">Pay online (Razorpay)</span><span className="block font-sans text-xs text-ink-soft">UPI, cards &amp; netbanking · paid securely now</span></span>
                </label>
              )}
              <label data-testid="pay-cod" className={`flex items-center gap-3 border rounded-lg px-3.5 py-3 cursor-pointer transition-colors ${method === "cod" ? "border-terracotta bg-terracotta/[0.06]" : "border-ink/15"}`}>
                <input type="radio" name="pay" checked={method === "cod"} onChange={() => setMethod("cod")} className="accent-terracotta" />
                <span><span className="font-sans text-sm text-ink font-medium">Cash on Delivery</span><span className="block font-sans text-xs text-ink-soft">Pay in cash on delivery, as per the confirmed COD arrangement</span></span>
              </label>
            </div>
          </div>

          {/* 5. Pay & place order */}
          <div>
            <button type="submit" disabled={submitting} data-testid="checkout-submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full disabled:opacity-60">
              {submitting ? <><Loader2 size={17} className="animate-spin" /> Processing…</> : (method === "razorpay" ? <>Pay &amp; place order</> : <>Place order &amp; get invoice</>)}
            </button>
            {/* 6. Payment & order confirmation information (matches selected method) */}
            <p className="font-sans text-[11px] text-ink-soft text-center mt-3 leading-relaxed" data-testid="checkout-pay-note">
              {method === "razorpay"
                ? "You'll complete payment securely via Razorpay now. Your order is marked PAID only after the payment is verified by our backend."
                : "No online payment is taken now. You'll pay in cash on delivery, as per the confirmed COD arrangement."}
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}

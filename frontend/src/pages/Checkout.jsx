import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingBag, MessageCircle } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import {
  COUNTRIES, countryByCode, cartWeightKg, computeShipping,
  getFxRates, convertFromInr, fmtMoney,
} from "@/lib/intl";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, count, allPriced, grandTotal, orderRef, clear, whatsappUrl } = useCart();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", city: "", state: "", postcode: "", country: "IN" });
  const [submitting, setSubmitting] = useState(false);
  const [rzp, setRzp] = useState({ enabled: false, key_id: "" });
  const [fx, setFx] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const method = "razorpay"; // Cash on Delivery removed — verified online payment only

  const c = countryByCode(form.country);
  const weightKg = useMemo(() => cartWeightKg(items), [items]);
  const shipping = useMemo(() => computeShipping(c.region, form.postcode, weightKg), [c.region, form.postcode, weightKg]);
  const subtotalInr = allPriced ? grandTotal : null;
  const totalInr = (allPriced && shipping.status === "ok") ? subtotalInr + shipping.amount : null;
  const onlineEligible = form.country === "IN" && shipping.status === "ok" && rzp.enabled && allPriced;

  useEffect(() => { api.get("/payments/razorpay/config").then(({ data }) => setRzp(data)).catch(() => {}); }, []);
  useEffect(() => { getFxRates().then(setFx); }, []);

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
    if (submitting) return;
    const mobile = form.mobile.replace(/\s+/g, "");
    if (!form.name.trim()) { toast.error("Please enter your full name."); return; }
    const minMobile = form.country === "IN" ? /^\d{10}$/ : /^\d{6,}$/;
    if (!minMobile.test(mobile)) { toast.error(form.country === "IN" ? "Please enter a valid 10-digit mobile number." : "Please enter a valid mobile number."); return; }
    if (!EMAIL_RE.test(form.email.trim())) { toast.error("Please enter a valid email address."); return; }
    if (!form.address.trim()) { toast.error("Please enter your delivery address."); return; }
    if (!form.city.trim()) { toast.error("Please enter your city."); return; }
    if (!form.state.trim()) { toast.error(`Please enter your ${c.stateLabel.toLowerCase()}.`); return; }
    if (!c.postalRe.test(form.postcode.trim())) { toast.error(`Please enter a valid ${c.postalLabel} (${c.postalHint}).`); return; }
    if (!onlineEligible) { toast.error("Online payment isn't available for this destination. Please use the enquiry option."); return; }

    const fullAddress = `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} ${form.postcode.trim()}, ${c.name}`;
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        customer_name: form.name.trim(),
        customer_mobile: `${c.dial} ${mobile}`,
        customer_email: form.email.trim(),
        delivery_address: fullAddress,
        country: form.country,
        postcode: form.postcode.trim(),
        client_ref: orderRef,
        payment_method: method,
        items: items.map((it) => ({ slug: it.slug, pack_label: it.packLabel, qty: it.qty })),
      });
      if (data.razorpay_order_id) {
        const ok = await loadRzpScript();
        if (!ok) { toast.error("Could not load the secure payment window. Please try again."); setSubmitting(false); return; }
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
            } catch (_) { /* confirmation shows Payment Pending if verify fails */ }
            goConfirm(data);
          },
          modal: { ondismiss: () => { toast("Payment cancelled — your order is saved as Payment Pending."); goConfirm(data); } },
        });
        rzpay.on("payment.failed", () => toast.error("Payment failed — order saved as Payment Pending."));
        rzpay.open();
        return;
      }
      toast.error("Could not start the payment. Please try again or contact us.");
      setSubmitting(false);
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Could not place your order. Please try again.");
      setSubmitting(false);
    }
  };

  const labelCls = "block font-sans text-xs uppercase tracking-[0.18em] text-ink-soft mb-1.5";
  const inputCls = "w-full border border-ink/15 rounded-lg bg-ivory px-3.5 py-3 font-sans text-sm text-ink focus:outline-none focus:border-terracotta transition-colors";

  const est = (inrAmt) => {
    const v = convertFromInr(inrAmt, c.currency, fx);
    return v == null ? null : fmtMoney(v, c.currency, c.symbol);
  };
  const showEstimate = c.currency !== "INR";

  return (
    <div data-testid="checkout-page">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-terracotta" data-testid="checkout-back">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <section className="max-w-2xl mx-auto px-5 sm:px-8 py-6 lg:py-10 space-y-8">
        <div>
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Checkout</span>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight mt-2 text-ink leading-tight">Checkout</h1>
          <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">Review your order, add your delivery details and pay securely online.</p>
        </div>

        {/* 1. Order summary */}
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
          <div className="mt-4 space-y-1.5">
            <Row label="Product subtotal" value={subtotalInr != null ? inr(subtotalInr) : "To be confirmed"} />
            <Row label="Shipping" value={shipping.status === "ok" ? inr(shipping.amount) : "Quote required"} />
            <div className="flex justify-between pt-2 border-t border-beige">
              <span className="font-sans text-sm text-ink-soft">Total {showEstimate ? "(charged in INR)" : ""}</span>
              <span className="font-serif text-lg text-terracotta" data-testid="checkout-total">{totalInr != null ? inr(totalInr) : "Quote required"}</span>
            </div>
            {showEstimate && totalInr != null && est(totalInr) && (
              <p className="font-sans text-[11px] text-ink-soft pt-1" data-testid="checkout-estimate">
                ≈ {est(totalInr)} estimated · FX rate as of {fx?.date}{fx?.stale ? " (cached)" : ""}. You'll be charged in INR; your bank may apply its own rate/fees.
              </p>
            )}
            {showEstimate && !fx && (
              <p className="font-sans text-[11px] text-ink-soft pt-1">Currency estimate unavailable right now — amounts shown in INR. Final total confirmed on enquiry.</p>
            )}
            <p className="font-sans text-[11px] text-ink-soft pt-1 leading-relaxed">{shipping.note}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-8" data-testid="checkout-form">
          {/* 2. Your details */}
          <div>
            <h2 className="font-serif text-2xl text-ink">Your details</h2>
            <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">Enter your contact and delivery details so we can prepare your order. Your order total is shown in the order summary above.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className={labelCls} htmlFor="co-name">Full name *</label>
                <input id="co-name" className={inputCls} value={form.name} onChange={set("name")} data-testid="checkout-name" autoComplete="name" />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-country">Country *</label>
                <select id="co-country" className={inputCls} value={form.country} onChange={set("country")} data-testid="checkout-country" autoComplete="country">
                  {COUNTRIES.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="co-mobile">Mobile number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-ink/15 rounded-l-lg bg-ivory-warm font-sans text-sm text-ink-soft" data-testid="checkout-dial">{c.dial}</span>
                    <input id="co-mobile" className={`${inputCls} rounded-l-none`} value={form.mobile} onChange={set("mobile")} data-testid="checkout-mobile" inputMode="tel" autoComplete="tel" placeholder="Mobile number" />
                  </div>
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
                  <label className={labelCls} htmlFor="co-state">{c.stateLabel} *</label>
                  <input id="co-state" className={inputCls} value={form.state} onChange={set("state")} data-testid="checkout-state" autoComplete="address-level1" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="co-postcode">{c.postalLabel} *</label>
                  <input id="co-postcode" className={inputCls} value={form.postcode} onChange={set("postcode")} data-testid="checkout-postcode" inputMode="text" autoComplete="postal-code" placeholder={c.postalHint} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Payment method — online only */}
          <div>
            <h2 className="font-serif text-2xl text-ink">Payment method</h2>
            {onlineEligible ? (
              <div data-testid="pay-razorpay" className="flex items-center gap-3 border border-terracotta bg-terracotta/[0.06] rounded-lg px-3.5 py-3 mt-4">
                <span className="h-4 w-4 rounded-full border-[5px] border-terracotta shrink-0" aria-hidden="true" />
                <span><span className="font-sans text-sm text-ink font-medium">Pay online (Razorpay)</span><span className="block font-sans text-xs text-ink-soft">UPI, cards &amp; netbanking · charged in INR, paid securely now</span></span>
              </div>
            ) : (
              <div data-testid="pay-unavailable" className="border border-ink/15 rounded-lg px-3.5 py-4 mt-4 bg-ivory-warm">
                <p className="font-sans text-sm text-ink">
                  {form.country !== "IN"
                    ? "International shipping & payment quote required."
                    : shipping.status !== "ok"
                      ? "A shipping quote is required for this PIN code."
                      : "Online payment isn't available for this order right now."}
                </p>
                <p className="font-sans text-xs text-ink-soft mt-1">We don't charge an unconfirmed amount. Please send us your order and address and we'll confirm shipping and payment.</p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" data-testid="checkout-enquire"
                   className="inline-flex items-center gap-1.5 mt-3 font-sans text-xs uppercase tracking-[0.14em] text-terracotta border border-terracotta rounded-full px-3.5 py-2 hover:bg-terracotta hover:text-ivory transition-colors">
                  <MessageCircle size={14} /> Enquire on WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* 4. Pay & place order */}
          <div>
            <button type="submit" disabled={submitting || !onlineEligible} data-testid="checkout-submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 size={17} className="animate-spin" /> Processing…</> : <>Pay &amp; place order</>}
            </button>
            <p className="font-sans text-[11px] text-ink-soft text-center mt-3 leading-relaxed" data-testid="checkout-pay-note">
              You'll complete payment securely via Razorpay now, charged in INR. Your order is marked PAID only after the payment is verified by our backend.
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="font-sans text-sm text-ink-soft">{label}</span>
      <span className="font-sans text-sm text-ink">{value}</span>
    </div>
  );
}

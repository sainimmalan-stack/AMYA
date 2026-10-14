import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingBag, MessageCircle, ShieldCheck } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import {
  COUNTRIES, countryByCode, cartWeightKg, computeShipping,
  getFxRates, convertFromInr, fmtMoney,
} from "@/lib/intl";

const WA_NUMBER = "919675334567";
const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, count, allPriced, grandTotal, orderRef, clear, newOrderRef } = useCart();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", city: "", state: "", postcode: "", country: "IN" });
  const [submitting, setSubmitting] = useState(false);
  const [rzp, setRzp] = useState({ enabled: false, key_id: "" });
  const [fx, setFx] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // Changing country revalidates location: clear state + postcode so India's PIN rule never leaks to other countries.
  const onCountry = (e) => setForm((f) => ({ ...f, country: e.target.value, state: "", postcode: "" }));
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

  // Shared field validation. forOnline additionally requires a valid email (needed for the invoice).
  const validateCore = (forOnline) => {
    const mobile = form.mobile.replace(/\s+/g, "");
    if (!form.name.trim()) { toast.error("Please enter your full name."); return null; }
    const minMobile = form.country === "IN" ? /^\d{10}$/ : /^\d{6,}$/;
    if (!minMobile.test(mobile)) { toast.error(form.country === "IN" ? "Please enter a valid 10-digit mobile number." : "Please enter a valid mobile number."); return null; }
    if (forOnline && !EMAIL_RE.test(form.email.trim())) { toast.error("Please enter a valid email address."); return null; }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) { toast.error("Please enter a valid email address."); return null; }
    if (!form.address.trim()) { toast.error("Please enter your delivery address."); return null; }
    if (!form.city.trim()) { toast.error("Please enter your city."); return null; }
    if (!form.state.trim()) { toast.error(`Please enter your ${c.stateLabel.toLowerCase()}.`); return null; }
    if (!c.postalRe.test(form.postcode.trim())) { toast.error(`Please enter a valid ${c.postalLabel} (${c.postalHint}).`); return null; }
    return mobile;
  };

  const fullAddress = () => `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} ${form.postcode.trim()}, ${c.name}`;

  // Option A — pay securely online (India + confirmed shipping only)
  const payOnline = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const mobile = validateCore(true);
    if (!mobile) return;
    if (!onlineEligible) { toast.error("Online payment isn't available for this destination yet. Please use the WhatsApp option."); return; }

    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        customer_name: form.name.trim(),
        customer_mobile: `${c.dial} ${mobile}`,
        customer_email: form.email.trim(),
        delivery_address: fullAddress(),
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

  // Option B — order on WhatsApp (always available; states clearly when shipping must be confirmed)
  const buildWaMessage = () => {
    const mobile = form.mobile.replace(/\s+/g, "");
    const shipConfirmed = shipping.status === "ok";
    const lines = [
      "Hello AMYA! I would like to place an order.",
      "",
      `Order reference: ${orderRef}`,
      "",
      `Customer: ${form.name.trim()}`,
      `Mobile: ${c.dial} ${mobile}`,
    ];
    if (form.email.trim()) lines.push(`Email: ${form.email.trim()}`);
    lines.push(`Delivery address: ${fullAddress()}`);
    lines.push("");
    lines.push("My Order:");
    items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name}`);
      if (it.packLabel) lines.push(`   Pack size: ${it.packLabel}`);
      lines.push(`   Quantity: ${it.qty} pack${it.qty > 1 ? "s" : ""}`);
      if (it.price != null) {
        lines.push(`   Price: ${inr(it.price)} per pack`);
        lines.push(`   Subtotal: ${inr(it.price * it.qty)}`);
      } else {
        lines.push("   Price: To be confirmed");
      }
    });
    lines.push("");
    lines.push(`Parcel weight (billable): ${shipping.billableKg} kg`);
    lines.push(subtotalInr != null ? `Product subtotal: ${inr(subtotalInr)}` : "Product subtotal: To be confirmed");
    if (c.region !== "IN" && shipping.ratePerKg != null && shipConfirmed) lines.push(`Shipping rate: ${inr(shipping.ratePerKg)} per kg`);
    lines.push(`Shipping: ${shipConfirmed ? inr(shipping.amount) : "Shipping quote required"}`);
    if (totalInr != null) {
      lines.push(`Final total: ${inr(totalInr)}`);
    } else {
      lines.push("Final total: To be confirmed once shipping is confirmed");
    }
    lines.push("");
    if (!shipConfirmed) {
      lines.push("Please confirm the shipping charge for my address before I pay — the shipping amount is not yet confirmed for this location.");
    } else {
      lines.push("Please confirm availability and the expected dispatch/delivery date. I understand this message is an enquiry and does not confirm payment.");
    }
    lines.push("");
    lines.push("Thank you!");
    return lines.join("\n");
  };

  const orderOnWhatsApp = () => {
    const mobile = validateCore(false);
    if (!mobile) return;
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWaMessage())}`;
    window.open(url, "_blank", "noreferrer");
    newOrderRef();
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
          <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">Add your delivery details, enter your PIN/ZIP to see shipping, then pay online or order on WhatsApp.</p>
        </div>

        {/* 1. Cart review — items only */}
        <div className="rounded-xl border border-beige bg-ivory-warm p-5 sm:p-6" data-testid="checkout-cart">
          <h2 className="font-serif text-xl text-ink">Your items ({count})</h2>
          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <div key={it.key} className="flex justify-between gap-3 border-b border-beige pb-3 last:border-0 last:pb-0" data-testid={`summary-item-${it.slug}`}>
                <div className="min-w-0">
                  <p className="font-serif text-base text-ink leading-tight">{it.name}</p>
                  {it.packLabel && <p className="font-sans text-xs text-ink-soft mt-0.5">Pack size: {it.packLabel} · Qty {it.qty}</p>}
                  {it.price != null && <p className="font-sans text-xs text-ink-soft mt-0.5">{inr(it.price)} each</p>}
                </div>
                <div className="font-sans text-sm text-ink whitespace-nowrap">{it.price != null ? inr(it.price * it.qty) : "—"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Your details */}
        <div>
          <h2 className="font-serif text-2xl text-ink">Your details</h2>
          <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">Enter your contact and delivery details. Your shipping charge appears in the order summary below as soon as you add your PIN/ZIP.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className={labelCls} htmlFor="co-name">Full name *</label>
              <input id="co-name" className={inputCls} value={form.name} onChange={set("name")} data-testid="checkout-name" autoComplete="name" />
            </div>
            <div>
              <label className={labelCls} htmlFor="co-country">Country *</label>
              <select id="co-country" className={inputCls} value={form.country} onChange={onCountry} data-testid="checkout-country" autoComplete="country">
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
                <label className={labelCls} htmlFor="co-email">Email address {onlineEligible ? "*" : "(optional)"}</label>
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

        {/* 3. Order summary with live shipping — right after the address/PIN, before payment */}
        <div className="rounded-xl border border-terracotta/30 bg-ivory-warm p-5 sm:p-6" data-testid="checkout-summary">
          <h2 className="font-serif text-xl text-ink">Order summary</h2>
          <div className="mt-4 space-y-1.5">
            <Row label="Product subtotal" value={subtotalInr != null ? inr(subtotalInr) : "To be confirmed"} />

            {c.region !== "IN" ? (
              <div className="rounded-lg bg-ivory border border-beige px-3 py-2.5 my-1" data-testid="checkout-intl-breakdown">
                <p className="font-sans text-xs uppercase tracking-[0.14em] text-terracotta mb-1.5">International shipping</p>
                <Row label="Parcel weight (billable)" value={`${shipping.billableKg} kg`} />
                {shipping.ratePerKg != null && <Row label="Shipping rate" value={`${inr(shipping.ratePerKg)} per kg`} />}
                <Row label="Shipping charge" value={shipping.status === "ok" ? inr(shipping.amount) : "Quote required"} />
              </div>
            ) : (
              <Row label="Shipping" value={shipping.status === "ok" ? inr(shipping.amount) : "Quote required"} />
            )}

            <div className="flex justify-between pt-2 border-t border-beige">
              <span className="font-sans text-sm text-ink-soft">Final total {showEstimate ? "(charged in INR)" : ""}</span>
              <span className="font-serif text-lg text-terracotta" data-testid="checkout-total">{totalInr != null ? inr(totalInr) : "Quote required"}</span>
            </div>
            {showEstimate && totalInr != null && est(totalInr) && (
              <p className="font-sans text-[11px] text-ink-soft pt-1" data-testid="checkout-estimate">
                ≈ {est(totalInr)} estimated · FX rate as of {fx?.date}{fx?.stale ? " (cached)" : ""}. You'll be charged in INR; your bank may apply its own rate/fees.
              </p>
            )}
            <p className="font-sans text-[11px] text-ink-soft pt-1 leading-relaxed" data-testid="checkout-ship-note">{shipping.note}</p>
          </div>
        </div>

        {/* 4. Two order options */}
        <div className="space-y-4" data-testid="checkout-options">
          <h2 className="font-serif text-2xl text-ink">Place your order</h2>

          {/* Option A — Pay securely online */}
          {onlineEligible ? (
            <button type="button" onClick={payOnline} disabled={submitting} data-testid="checkout-pay-online"
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 size={17} className="animate-spin" /> Processing…</> : <><ShieldCheck size={16} /> Pay Securely with Razorpay</>}
            </button>
          ) : (
            <div data-testid="pay-unavailable" className="border border-ink/15 rounded-lg px-3.5 py-3.5 bg-ivory-warm">
              <p className="font-sans text-sm text-ink">
                {form.country !== "IN"
                  ? "Online payment for international orders isn't available yet — please order on WhatsApp and we'll confirm shipping and payment."
                  : shipping.status !== "ok"
                    ? "A shipping quote is required for this PIN code before online payment. Please order on WhatsApp."
                    : "Online payment isn't available for this order right now — please order on WhatsApp."}
              </p>
            </div>
          )}

          {/* Option B — Order on WhatsApp (always) */}
          <button type="button" onClick={orderOnWhatsApp} data-testid="checkout-whatsapp"
            className="w-full inline-flex items-center justify-center gap-2 border border-terracotta text-terracotta hover:bg-terracotta hover:text-ivory transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full">
            <MessageCircle size={16} /> Order on WhatsApp
          </button>

          <p className="font-sans text-[11px] text-ink-soft text-center leading-relaxed" data-testid="checkout-pay-note">
            {onlineEligible
              ? "Razorpay supports UPI, cards & netbanking · charged in INR. Your order is marked PAID only after payment is verified by our backend. WhatsApp is an enquiry and does not confirm payment."
              : "We never charge an unconfirmed amount. Sending your order on WhatsApp lets us confirm shipping and share a secure payment link. A WhatsApp message is an enquiry and does not confirm payment."}
          </p>
        </div>
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

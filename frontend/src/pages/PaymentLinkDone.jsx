import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PaymentLinkDone() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const ref = params.get("ref");
  const paid = status === "paid";

  return (
    <div className="max-w-xl mx-auto px-5 py-24 sm:py-32 text-center" data-testid="payment-link-done">
      {paid ? (
        <CheckCircle2 className="mx-auto text-terracotta" size={48} strokeWidth={1.5} />
      ) : (
        <XCircle className="mx-auto text-ink/40" size={48} strokeWidth={1.5} />
      )}
      <h1 className="font-serif text-3xl sm:text-4xl text-ink mt-6 leading-tight" data-testid="pld-title">
        {paid ? "Payment received — thank you" : "Payment not completed"}
      </h1>
      <p className="font-sans text-base text-ink-soft mt-4 leading-relaxed">
        {paid
          ? "Your payment was successful and your AMYA order is confirmed. We'll prepare your order and keep you updated on WhatsApp."
          : "We couldn't confirm this payment. If you were charged, please contact us on WhatsApp and we'll help right away."}
      </p>
      {paid && ref && (
        <p className="font-sans text-sm text-ink mt-4" data-testid="pld-ref">Order reference: <b>{ref}</b></p>
      )}
      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
        <Link to="/shop" className="inline-flex items-center justify-center bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors px-6 py-3 rounded-full font-sans text-xs uppercase tracking-[0.18em]" data-testid="pld-shop">Continue browsing</Link>
        <a href="https://wa.me/919675334567" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center border border-terracotta text-terracotta hover:bg-terracotta hover:text-ivory transition-colors px-6 py-3 rounded-full font-sans text-xs uppercase tracking-[0.18em]" data-testid="pld-wa">Message AMYA</a>
      </div>
    </div>
  );
}

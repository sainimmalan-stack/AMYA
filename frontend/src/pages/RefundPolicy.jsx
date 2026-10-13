import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/api";

const SECTIONS = [
  {
    title: "Damaged or incorrect orders",
    body: "Please contact us within 24 hours of delivery if your order arrives damaged or contains an incorrect product. We will review the issue and arrange an appropriate refund or replacement.",
  },
  {
    title: "Product quality concerns",
    body: "If you experience a genuine quality issue, contact us with your order details. We will assess the concern and work towards a fair resolution.",
  },
  {
    title: "Food safety concerns",
    body: "Stop consuming the product and contact us immediately if you suspect a food safety issue. We will investigate the concern and take appropriate action.",
  },
];

const STEPS = [
  "Contact us through WhatsApp or our official contact channel.",
  "Share your order number and explain the issue.",
  "Provide photographs of the product or packaging where applicable.",
  "Our team will review your concern and communicate the next steps.",
];

export default function RefundPolicy() {
  return (
    <div data-testid="refund-policy-page">
      <PageHero
        eyebrow="AMYA Quality Guarantee"
        titleLines={["Refund &", "Replacement."]}
        subtitle="Your trust. Our promise. Always."
      />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <Reveal>
          <p className="font-sans text-base text-ink-soft leading-relaxed">
            At AMYA, we take pride in the quality of our artisanal foods and want every customer to have a
            positive experience.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className="rounded-xl border border-beige bg-ivory-warm px-6 py-6" data-testid={`refund-section-${i}`}>
                <h2 className="font-serif text-xl sm:text-2xl text-ink leading-tight">{s.title}</h2>
                <p className="font-sans text-sm sm:text-base text-ink-soft mt-2.5 leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-ink">How to request a resolution</h2>
            <ol className="mt-5 grid gap-3">
              {STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 font-sans text-sm sm:text-base text-ink-soft leading-relaxed">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-terracotta text-ivory flex items-center justify-center font-sans text-xs font-semibold">{i + 1}</span>
                  <span className="mt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-12 border-t border-ink/15 pt-8">
            <p className="font-sans text-base text-ink leading-relaxed">
              AMYA believes in good ingredients, careful preparation, and honest customer service.
            </p>
            <p className="font-serif text-xl text-terracotta mt-4">AMYA — Artisanal Foods</p>
            <p className="font-sans text-sm text-ink-soft mt-1">Made with care. Backed by our promise.</p>
            <a
              href={waLink("919675334567", "Hello AMYA, I would like to raise an order concern.")}
              target="_blank"
              rel="noreferrer"
              data-testid="refund-whatsapp"
              className="mt-6 inline-flex items-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-3 px-6 font-sans text-xs uppercase tracking-[0.18em] rounded-full"
            >
              <MessageCircle size={16} /> Contact us on WhatsApp
            </a>
          </div>
        </Reveal>

        <Reveal>
          <p className="font-sans text-xs text-ink-soft mt-10 leading-relaxed">
            This policy sets out AMYA's customer-service approach and does not limit or override any rights you
            may have under applicable consumer law.{" "}
            <Link to="/policies/refund" className="link-underline text-ink">View cancellation & refund terms</Link>.
          </p>
        </Reveal>
      </section>
    </div>
  );
}

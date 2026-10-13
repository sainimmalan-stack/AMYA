import { Droplet, Recycle, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useConfig } from "@/context/ConfigContext";
import { waLink } from "@/lib/api";

export const OilRefillOffer = () => {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";

  return (
    <Reveal>
      <div
        data-testid="oil-refill-offer"
        className="rounded-2xl border border-terracotta/30 bg-terracotta/5 px-6 py-7 sm:px-8 sm:py-8 mb-8 sm:mb-10"
      >
        <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-terracotta">Hyderabad only</span>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink mt-2 leading-tight [text-wrap:balance]">
          Bring Your Own Bottle &amp; Save ₹60
        </h2>
        <p className="font-sans text-sm sm:text-base text-ink-soft mt-2 leading-relaxed">
          Ordering from Hyderabad? Save ₹60 on bottling charges.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl bg-ivory/70 border border-beige px-5 py-5" data-testid="oil-offer-refill">
            <div className="flex items-center gap-2.5">
              <Droplet size={18} className="text-terracotta shrink-0" />
              <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium">Refill &amp; Save</h3>
            </div>
            <p className="font-sans text-sm text-ink-soft mt-2.5 leading-relaxed">
              Hyderabad customers can visit us in person with their own suitable, clean bottle and get their oil
              refilled, saving ₹60 on bottling charges.
            </p>
          </div>

          <div className="rounded-xl bg-ivory/70 border border-beige px-5 py-5" data-testid="oil-offer-return">
            <div className="flex items-center gap-2.5">
              <Recycle size={18} className="text-terracotta shrink-0" />
              <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium">Return Your AMYA Bottle</h3>
            </div>
            <p className="font-sans text-sm text-ink-soft mt-2.5 leading-relaxed">
              Customers can return an eligible AMYA bottle and receive ₹60 back, subject to confirmation and
              bottle-return terms.
            </p>
          </div>
        </div>

        <p className="font-sans text-xs text-ink-soft mt-5 leading-relaxed">
          Available to Hyderabad customers only. Please message us on WhatsApp before visiting. The ₹60 bottling-charge
          saving (refill) and the ₹60 bottle-return refund are separate benefits and are not applied automatically to
          online orders.
        </p>

        <a
          href={waLink(wa, "Hello AMYA, I'm in Hyderabad and would like to know more about the Bring Your Own Bottle refill / bottle-return offer on oils.")}
          target="_blank"
          rel="noreferrer"
          data-testid="oil-offer-whatsapp"
          className="mt-5 inline-flex items-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-3 px-6 font-sans text-xs uppercase tracking-[0.18em] rounded-full"
        >
          <MessageCircle size={16} /> Contact Us on WhatsApp
        </a>
      </div>
    </Reveal>
  );
};

export default OilRefillOffer;

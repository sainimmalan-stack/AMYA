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
        className="rounded-2xl border border-terracotta/30 bg-terracotta/5 px-5 py-4 sm:px-6 sm:py-5 mb-6 sm:mb-8"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-serif text-xl sm:text-2xl text-ink leading-tight">
            Bring Your Own Bottle &amp; Save ₹60
          </h2>
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-terracotta">Hyderabad only</span>
        </div>

        <ul className="mt-3 grid gap-2">
          <li className="flex items-start gap-2.5 font-sans text-sm text-ink-soft leading-relaxed" data-testid="oil-offer-refill">
            <Droplet size={16} className="text-terracotta shrink-0 mt-0.5" />
            Hyderabad customers can bring a clean, suitable bottle for refilling and save ₹60 on bottling charges.
          </li>
          <li className="flex items-start gap-2.5 font-sans text-sm text-ink-soft leading-relaxed" data-testid="oil-offer-return">
            <Recycle size={16} className="text-terracotta shrink-0 mt-0.5" />
            Return your eligible AMYA bottle and receive ₹60 back, subject to confirmation and return terms.
          </li>
        </ul>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <a
            href={waLink(wa, "Hello AMYA, I'm in Hyderabad and would like to know more about the Bring Your Own Bottle refill / bottle-return offer on oils.")}
            target="_blank"
            rel="noreferrer"
            data-testid="oil-offer-whatsapp"
            className="inline-flex items-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-2.5 px-5 font-sans text-xs uppercase tracking-[0.16em] rounded-full"
          >
            <MessageCircle size={15} /> Contact on WhatsApp
          </a>
          <p className="font-sans text-xs text-ink-soft">Hyderabad only — please message us before visiting.</p>
        </div>
      </div>
    </Reveal>
  );
};

export default OilRefillOffer;

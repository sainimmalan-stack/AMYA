import { Reveal } from "@/components/Reveal";
import Btn from "@/components/Btn";
import { Phone, MessageCircle } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { waLink, telHref, formatPhoneIN } from "@/lib/api";

export default function OurStory() {
  const { config } = useConfig();
  const phone = config?.business?.phone || "9675334567";
  const wa = config?.business?.whatsapp || "919675334567";
  const fssai = config?.settings?.fssai_number || "23626448000230";

  return (
    <div data-testid="our-story-page" className="bg-ivory">
      {/* Amulya & Leela — original photograph, prominent at the very top */}
      <Reveal>
        <figure className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12" data-testid="our-story-top-photo">
          <img
            src="/products/our-story-kitchen.jpg"
            alt="Amulya and her mother in law, Leela, together preparing traditional homemade food in a kitchen."
            loading="eager"
            decoding="async"
            className="block w-full h-auto rounded-2xl sm:rounded-3xl shadow-[0_18px_50px_-24px_rgba(74,44,28,0.45)]"
          />
          <figcaption className="mt-3 font-sans text-xs text-ink-soft tracking-wide">
            Amulya Nimmala with her mother in law, Leela.
          </figcaption>
        </figure>
      </Reveal>

      {/* The story — directly below the portrait, left-aligned editorial column */}
      <article className="max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16 text-left" data-testid="our-story-article">
        <Reveal>
          <span className="block font-sans text-sm tracking-wide text-terracotta">Founded by Amulya Nimmala</span>
          <h1 className="font-serif text-4xl sm:text-5xl tracking-tight mt-3 leading-[1.08] text-ink">A simple goal.</h1>
          <div className="mt-6 h-px w-14 bg-terracotta/40" />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 space-y-6 font-sans text-base sm:text-lg text-ink-soft leading-[1.8]">
            <p>AMYA began with a simple intention: to help customers understand what they buy and how it is prepared.</p>
            <p>Founded by Amulya Nimmala, AMYA brings together a love of cooking, thoughtfully sourced ingredients and traditional recipes. Amulya and her mother in law, Leela, share a passion for preparing familiar Indian foods with care.</p>
            <p>Together, they select ingredients carefully and prepare products in small batches, giving every recipe the time and attention it deserves.</p>
            <p>We are starting with a focused selection of homemade foods and growing thoughtfully, one batch at a time.</p>
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Btn as="a" href={telHref(phone)} variant="solid" data-testid="story-call"><Phone size={15} /> {formatPhoneIN(phone)}</Btn>
            <Btn as="a" href={waLink(wa, "Hello AMYA")} target="_blank" rel="noreferrer" variant="outline" data-testid="story-whatsapp"><MessageCircle size={15} /> WhatsApp</Btn>
          </div>
          <p className="mt-10 font-sans text-xs text-ink-soft/80 tracking-wide" data-testid="our-story-fssai">
            FSSAI Registration No.: {fssai}
          </p>
        </Reveal>
      </article>
    </div>
  );
}

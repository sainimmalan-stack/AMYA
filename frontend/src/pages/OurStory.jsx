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
            alt="Amulya and her mother-in-law, Leela, together preparing traditional homemade food in a kitchen."
            loading="eager"
            decoding="async"
            className="block w-full h-auto rounded-2xl sm:rounded-3xl shadow-[0_18px_50px_-24px_rgba(74,44,28,0.45)]"
          />
          <figcaption className="mt-3 text-center font-sans text-xs text-ink-soft tracking-wide">
            Amulya Nimmala with her mother-in-law, Leela.
          </figcaption>
        </figure>
      </Reveal>

      {/* The story — directly below the portrait, narrow editorial column */}
      <article className="max-w-2xl mx-auto px-5 sm:px-8 py-14 sm:py-20" data-testid="our-story-article">
        <Reveal>
          <span className="block text-center font-sans text-xs uppercase tracking-[0.34em] text-terracotta">Our Story</span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-5 leading-[1.12] text-ink text-center [text-wrap:balance]">
            Two Generations.<br className="hidden sm:block" /> One Love for Food.
          </h1>
          <div className="mx-auto mt-6 h-px w-14 bg-terracotta/40" />
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-10 space-y-6 font-sans text-[17px] sm:text-lg text-ink-soft leading-[1.8]">
            <p>
              AMYA was born from a simple love for cooking, traditional flavours and the joy of sharing
              food made with care.
            </p>
            <p>
              Amulya Nimmala brings her passion for cooking to every small batch, creating familiar Indian
              flavours with attention to ingredients, preparation and taste. Her mother-in-law, Leela, shares
              that passion and brings her own experience, helping source quality raw ingredients from trusted
              places across India.
            </p>
            <p>
              Together, they bring two generations into one kitchen—where traditional knowledge meets a
              thoughtful, modern approach to homemade food.
            </p>
            <p>
              From our signature cashew brittle to traditional podis, spice blends and other homemade
              favourites, every batch is prepared with care and offered in small quantities.
            </p>
            <p>
              At AMYA, we believe good food should never need to be rushed. Orders are prepared after they are
              placed, allowing us to focus on freshness, care and consistency rather than mass production.
            </p>
            <p>
              AMYA is not about making more. It is about making food we are proud to share with your family.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mt-12 text-center font-serif text-2xl sm:text-3xl text-terracotta leading-snug">
            Made with care.<br />Shared with love.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-3">
            <Btn as="a" href={telHref(phone)} variant="solid" data-testid="story-call"><Phone size={15} /> {formatPhoneIN(phone)}</Btn>
            <Btn as="a" href={waLink(wa, "Hello AMYA")} target="_blank" rel="noreferrer" variant="outline" data-testid="story-whatsapp"><MessageCircle size={15} /> WhatsApp</Btn>
          </div>
          <p className="mt-10 text-center font-sans text-xs text-ink-soft/80 tracking-wide" data-testid="our-story-fssai">
            FSSAI Registration No.: {fssai}
          </p>
        </Reveal>
      </article>
    </div>
  );
}

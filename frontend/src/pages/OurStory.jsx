import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import Btn from "@/components/Btn";
import { Phone, MessageCircle } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { waLink, telHref, formatPhoneIN } from "@/lib/api";

const FOUNDER_IMG = "https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/90db7f6ed02e04d8ea700c2a4186305f0e60109e98720b0ebc2e2960b147ff31.jpeg";

export default function OurStory() {
  const { config } = useConfig();
  const phone = config?.business?.phone || "9675334567";
  const wa = config?.business?.whatsapp || "919675334567";
  return (
    <div data-testid="our-story-page">
      {/* Amulya & Leela — featured photograph at the very top of the page */}
      <Reveal>
        <figure className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8" data-testid="our-story-top-photo">
          <img
            src="/products/our-story-kitchen.jpg"
            alt="Amulya and her mother-in-law, Leela, together preparing traditional homemade food in a kitchen."
            loading="eager"
            decoding="async"
            className="block w-full h-auto rounded-2xl sm:rounded-3xl shadow-[0_18px_50px_-24px_rgba(74,44,28,0.45)]"
          />
        </figure>
      </Reveal>
      <PageHero
        eyebrow="Founder-led"
        titleLines={["The person", "behind AMYA."]}
        subtitle="AMYA is founded by Amulya Nimmala with a focus on thoughtfully prepared food, transparent processes and a personal customer experience."
      />
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-tl-[100px] bg-ivory-warm">
            <img src={FOUNDER_IMG} alt="Premium AMYA ingredients — cashews, sesame, dried red chillies, curry leaves and spice powders" className="h-full w-full object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <span className="block font-sans text-sm sm:text-[15px] tracking-wide text-terracotta">Founded by Amulya Nimmala</span>
          <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-3 leading-tight">A simple goal.</h2>
          <p className="font-sans text-base text-ink-soft mt-6 leading-relaxed">
            The goal is simple: help customers understand what they buy and how it is prepared. AMYA begins with a
            very limited selection of homemade food products — handcrafted in small batches using carefully chosen
            ingredients and time-honoured traditional recipes.
          </p>
          <p className="font-sans text-base text-ink-soft mt-4 leading-relaxed">
            We are starting small, focusing on a limited range of products and building our customer experience
            step by step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Btn as="a" href={telHref(phone)} variant="solid" data-testid="story-call"><Phone size={15} /> {formatPhoneIN(phone)}</Btn>
            <Btn as="a" href={waLink(wa, "Hello AMYA")} target="_blank" rel="noreferrer" variant="outline" data-testid="story-whatsapp"><MessageCircle size={15} /> WhatsApp</Btn>
          </div>
        </Reveal>
      </section>

      {/* Our Story — Amulya & Leela (real kitchen photograph) */}
      <section className="bg-ivory-warm" data-testid="our-story-two-generations">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20 lg:py-24">
          <Reveal>
            <span className="block text-center font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Our Story</span>
          </Reveal>
          <Reveal delay={0.16}>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-6 sm:mt-8 leading-tight text-ink text-center [text-wrap:balance]">
              Two Generations. One Love for Homemade Food.
            </h2>
            <div className="mt-6 space-y-4 font-sans text-base text-ink-soft leading-relaxed max-w-2xl mx-auto">
              <p>AMYA was born from Amulya's love for cooking and her passion for sharing the flavours of homemade Indian food.</p>
              <p>Together with her mother-in-law, Leela, she brings cherished family recipes, carefully selected ingredients and traditional cooking methods into the AMYA kitchen.</p>
              <p>From signature podis and traditional Andhra pickles to much-loved homemade treats, every small batch is prepared with patience, care and a genuine love for good food.</p>
              <p>AMYA is about preserving familiar flavours, honouring family traditions and sharing food made with care.</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

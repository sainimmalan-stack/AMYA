import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

const POINTS = [
  ["Founder led", "A brand led personally by Amulya Nimmala, not a faceless label."],
  ["A limited range", "A small, carefully selected set of products — introduced gradually, one at a time."],
  ["Homemade approach", "Relevant products are prepared homemade, in small batches."],
  ["Traditional oil press", "A planned traditional wooden chekku extraction experience you can watch live."],
  ["Clear information", "The importance of honest, accurate product information in everything we show."],
  ["Built step by step", "We grow deliberately, adding capability and products as we are ready."],
];

export default function About() {
  return (
    <div data-testid="about-page">
      <PageHero
        eyebrow="About AMYA"
        titleLines={["Starting small.", "Building trust."]}
        subtitle="At AMYA, we believe trust should be built through the way food is sourced, prepared, presented and delivered."
      />
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {POINTS.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 0.08}>
              <div className="border-t border-ink/15 pt-6">
                <span className="font-serif text-4xl text-terracotta/40">{`0${i + 1}`}</span>
                <h3 className="font-serif text-2xl mt-3">{t}</h3>
                <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-20 border-l-2 border-terracotta pl-6 max-w-3xl">
            <p className="font-serif text-2xl sm:text-3xl text-ink leading-snug">
              “We are starting small, focusing on a limited range of products and building our customer experience
              step by step.”
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

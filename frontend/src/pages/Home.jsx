import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Video, Leaf, Package, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, MaskedLines } from "@/components/Reveal";
import Btn from "@/components/Btn";
import ProductCard from "@/components/ProductCard";

const OIL_IMG = "https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/7825fb42e06e7d48d5b4d309f767b2582a3b1550f3169deb410a6f3ffef3d267.jpeg";
const PRESS_IMG = "https://images.unsplash.com/photo-1671568623404-44a3b99de0e6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";
const SEED_IMG = "https://images.unsplash.com/photo-1549978113-29eb25c8177f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section ref={ref} className="relative bg-terracotta text-ivory grain overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-start leading-none mb-10"
            >
              <span className="font-serif font-semibold tracking-[0.2em] text-ivory text-7xl sm:text-8xl">AMYA</span>
              <span className="font-sans uppercase text-[11px] mt-2 text-ivory/75" style={{ letterSpacing: "0.5em", paddingLeft: "0.5em" }}>
                Artisanal Foods
              </span>
            </motion.div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight">
              <MaskedLines lines={["Good food", "begins with trust."]} delay={0.25} />
            </h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
              className="font-sans text-base sm:text-lg text-ivory/85 max-w-xl mt-7 leading-relaxed"
            >
              Thoughtfully prepared artisanal foods, made in small batches. Discover our products and
              experience a more transparent way to choose your cooking oil.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 mt-10"
            >
              <Btn to="/shop" variant="solidIvory" data-testid="hero-explore-btn">
                Explore our collection <ArrowRight size={15} />
              </Btn>
              <Btn to="/live-press" variant="outlineIvory" data-testid="hero-livepress-btn">
                Discover AMYA Live Press
              </Btn>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="relative aspect-[3/4] overflow-hidden rounded-t-[120px] border border-ivory/20"
            >
              <motion.img src={OIL_IMG} alt="Premium wood-pressed oil" style={{ y, scale }}
                          className="h-full w-full object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["Wood-Pressed Oils", "Small Batches", "Watch It Live", "Founder-Led", "Homemade", "Transparent"];
  const row = [...words, ...words];
  return (
    <div className="bg-ivory border-y border-ink/10 py-5 overflow-hidden">
      <div className="marquee-track">
        {row.map((w, i) => (
          <span key={i} className="font-serif text-2xl sm:text-3xl text-ink/70 whitespace-nowrap px-8 flex items-center gap-8">
            {w} <span className="text-terracotta">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { icon: Leaf, t: "Choose your oil", d: "Select an available cooking oil and quantity." },
  { icon: Video, t: "Book your slot", d: "Pick an available date and time for preparation." },
  { icon: Eye, t: "Watch it live", d: "Join a WhatsApp video call to observe the actual process." },
  { icon: Package, t: "Receive your order", d: "Oil is packed and dispatched per your confirmed order." },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/products").then(({ data }) => setFeatured(data.filter((p) => p.featured).slice(0, 3)));
  }, []);

  return (
    <div>
      <Hero />
      <Marquee />

      {/* Brand intro */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">The AMYA way</span>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-5 leading-[1.02]">
                Food made with intention.
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="font-sans text-base sm:text-lg text-ink-soft leading-relaxed">
                AMYA is a founder-led artisanal food brand by Amulya Nimmala. We believe customers deserve
                clarity about the food they buy, the ingredients used and the process behind its preparation.
              </p>
              <Link to="/our-story" className="link-underline inline-flex items-center gap-2 mt-6 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="home-story-link">
                Meet the founder <ArrowRight size={14} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Live Press feature */}
      <section className="bg-terracotta text-ivory grain relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div className="relative aspect-[4/3] overflow-hidden rounded-br-[100px] border border-ivory/20">
                <img src={PRESS_IMG} alt="Traditional wooden oil press" className="h-full w-full object-cover" />
              </div>
            </Reveal>
            <div>
              <Reveal>
                <span className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/70">Signature experience</span>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-5 leading-[0.98]">
                  Don't just trust your oil. See how it's made.
                </h2>
                <p className="font-sans text-base text-ivory/85 mt-6 max-w-lg leading-relaxed">
                  AMYA Live Press — a more transparent way to buy oil. Choose your oil, book an available
                  preparation slot and connect with us to watch the oil extraction process live.
                </p>
              </Reveal>
              <div className="grid sm:grid-cols-2 gap-5 mt-10">
                {STEPS.map((s, i) => (
                  <Reveal key={s.t} delay={i * 0.08}>
                    <div className="flex gap-3">
                      <s.icon size={20} className="text-ivory/80 shrink-0 mt-1" />
                      <div>
                        <p className="font-sans text-xs uppercase tracking-[0.15em] text-ivory">{`0${i + 1} — ${s.t}`}</p>
                        <p className="font-sans text-sm text-ivory/70 mt-1">{s.d}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.2}>
                <Btn to="/live-press" variant="solidIvory" className="mt-10" data-testid="home-livepress-btn">
                  Book a live press <ArrowRight size={15} />
                </Btn>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24 lg:py-32">
        <Reveal>
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">A small, considered range</span>
              <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-4">From our collection</h2>
            </div>
            <Link to="/shop" className="link-underline hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="home-shop-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Transparency band */}
      <section className="bg-ink text-ivory relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[0.98]">
              Trust isn't a claim. It's a process.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-sans text-base text-ivory/75 leading-relaxed">
              Clear ingredient information, traceable production batches, honest descriptions of our
              extraction methods, and accurate delivery information. We present only what we have put in place.
            </p>
            <Btn to="/transparency" variant="outlineIvory" className="mt-8" data-testid="home-transparency-btn">
              Our transparency promise
            </Btn>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

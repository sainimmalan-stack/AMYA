import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Eye, MessageSquare, Lightbulb, Camera, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, MaskedLines } from "@/components/Reveal";
import Btn from "@/components/Btn";
import Availability from "@/components/Availability";
import ProductCard from "@/components/ProductCard";
import HomeBooking from "@/components/HomeBooking";

const OIL_IMG = "https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/7825fb42e06e7d48d5b4d309f767b2582a3b1550f3169deb410a6f3ffef3d267.jpeg";

function scrollToBook() {
  const el = document.getElementById("book-session");
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -80 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={ref} className="relative bg-terracotta text-ivory grain overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
              className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/75 block mb-6"
            >
              Transparency-first cooking oil
            </motion.span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.0] tracking-tight">
              <MaskedLines lines={["Your oil.", "Your questions.", "Our open process."]} delay={0.2} />
            </h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
              className="font-sans text-base sm:text-lg text-ivory/85 max-w-xl mt-6 leading-relaxed"
            >
              Know what goes into your cooking oil. Request a live video call to observe our actual oil
              preparation process and ask questions before placing an order.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 mt-9"
            >
              <Btn as="button" type="button" onClick={scrollToBook} variant="solidIvory" data-testid="hero-book-btn">
                Book a live oil session <ArrowRight size={15} />
              </Btn>
              <Btn to="/shop/oils" variant="outlineIvory" data-testid="hero-explore-oils-btn">
                Explore our oils
              </Btn>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="relative aspect-[3/4] overflow-hidden rounded-t-[120px] border border-ivory/20"
            >
              <motion.img src={OIL_IMG} alt="AMYA cooking oil" style={{ y, scale }} className="h-full w-full object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["Your Oil", "Your Questions", "Our Open Process", "Live Video Calls", "Small Batches", "Ask Before You Order"];
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

function OilCard({ p, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link to={`/product/${p.slug}`} data-testid={`oil-card-${p.slug}`} className="group block">
        <div className="relative overflow-hidden bg-ivory-warm aspect-[4/5]">
          {p.images?.[0] && (
            <img src={p.images[0]} alt={p.name}
                 className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
          )}
          <div className="absolute top-3 left-3"><Availability status={p.availability} /></div>
          <div className="absolute bottom-0 right-0 h-10 w-10 bg-terracotta text-ivory flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <ArrowUpRight size={16} />
          </div>
        </div>
        <h3 className="font-serif text-xl sm:text-2xl text-ink mt-4 leading-tight">{p.name}</h3>
        <p className="font-sans text-sm text-ink-soft mt-1 line-clamp-2">{p.short_description}</p>
      </Link>
    </motion.div>
  );
}

const WHY = [
  { icon: Eye, t: "See it", d: "Join a live WhatsApp video call to observe our actual oil preparation process, subject to availability." },
  { icon: MessageSquare, t: "Ask us", d: "Ask questions about the oil, the process and the ingredients, in real time, before you order." },
  { icon: Lightbulb, t: "Understand it", d: "Make an informed choice with clarity — transparency is the starting point, not a finished claim." },
];

export default function Home() {
  const [oils, setOils] = useState([]);
  const [secondary, setSecondary] = useState([]);

  useEffect(() => {
    api.get("/products?category=oils").then(({ data }) => setOils(data));
    Promise.all([api.get("/products?category=pickles"), api.get("/products?category=cashew-brittles")])
      .then(([pk, cb]) => setSecondary([...cb.data, ...pk.data]));
  }, []);

  return (
    <div>
      <Hero />
      <Marquee />

      {/* Oil showcase */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
        <Reveal>
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">The AMYA oils</span>
              <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-4">A considered range of cooking oils.</h2>
            </div>
            <Link to="/shop/oils" className="link-underline hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="home-oils-link">
              All oils <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {oils.map((p, i) => <OilCard key={p.id} p={p} index={i} />)}
        </div>
        <p className="font-sans text-xs text-ink-soft mt-8 max-w-2xl">
          Bottle images are design mock-ups, not photographs of finished packaging. Products are marked “Coming Soon”
          until availability, pricing and food-label details are confirmed by AMYA.
        </p>
      </section>

      {/* Live transparency + booking */}
      <section id="book-session" className="bg-terracotta text-ivory grain relative overflow-hidden scroll-mt-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28 relative z-10">
          <Reveal>
            <div className="max-w-3xl">
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/70">The AMYA difference</span>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-4 leading-[0.98]">
                See it. Ask us. Understand it.
              </h2>
              <p className="font-sans text-base text-ivory/85 mt-6 leading-relaxed">
                Request a WhatsApp video call to observe our actual oil preparation process, subject to availability,
                and ask your questions before placing an order.
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            {WHY.map((w, i) => (
              <Reveal key={w.t} delay={i * 0.08}>
                <div className="border-t border-ivory/25 pt-5">
                  <w.icon size={22} className="text-ivory/85" />
                  <h3 className="font-serif text-2xl mt-3">{w.t}</h3>
                  <p className="font-sans text-sm text-ivory/75 mt-2 leading-relaxed">{w.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-10 mt-14 items-start">
            {/* Machinery image area — clean placeholder until real photo is uploaded */}
            <Reveal>
              <div
                data-testid="machinery-image-area"
                className="relative aspect-[4/3] rounded-br-[80px] border border-dashed border-ivory/40 bg-terracotta-deep/40 flex flex-col items-center justify-center text-center px-8"
              >
                <Camera size={30} className="text-ivory/70" />
                <p className="font-serif text-2xl mt-4">Our oil-extraction machinery</p>
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-ivory/60 mt-3">Actual facility photograph — coming soon</p>
              </div>
            </Reveal>

            {/* Booking form */}
            <Reveal delay={0.1}>
              <HomeBooking />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Brand intro */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
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
                AMYA is a founder-led brand by Amulya Nimmala, built around cooking oil and a more transparent way to
                buy it. We believe customers deserve clarity about the food they buy, the ingredients used and the
                process behind its preparation.
              </p>
              <Link to="/our-story" className="link-underline inline-flex items-center gap-2 mt-6 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="home-story-link">
                Meet the founder <ArrowRight size={14} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Secondary products */}
      {secondary.length > 0 && (
        <section className="bg-ivory-warm">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
            <Reveal>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Beyond our oils</span>
                  <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mt-3">More from AMYA, added gradually.</h2>
                </div>
                <Link to="/shop" className="link-underline hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="home-shop-link">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {secondary.slice(0, 3).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Transparency band */}
      <section className="bg-ink text-ivory relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[0.98]">
              Trust isn't a claim. It's a process.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-sans text-base text-ivory/75 leading-relaxed">
              Clear ingredient information, traceable production batches, honest descriptions of our extraction
              methods, and accurate delivery information. We present only what we have put in place.
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

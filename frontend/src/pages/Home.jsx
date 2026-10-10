import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Eye, MessageSquare, ShieldCheck, MessageCircle, Phone, PackageCheck, Truck } from "lucide-react";
import { api, waLink, telHref, formatPhoneIN } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import { Reveal, MaskedLines } from "@/components/Reveal";
import Btn from "@/components/Btn";
import ProductCard from "@/components/ProductCard";

const HERO_IMG = "https://images.unsplash.com/photo-1643067077447-78239a403a18?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";
const VIDEO_MSG = "Hi AMYA, I would like to know more about your oils and request a video call.";

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <section ref={ref} className="relative bg-ivory-warm text-ink overflow-hidden border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-8 lg:pt-16 lg:pb-16 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">          <div className="lg:col-span-7">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
              className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta block mb-4">
              Authentic ingredients · Traditional recipes
            </motion.span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.0] tracking-tight text-ink">
              <MaskedLines lines={["Rooted in Tradition.", "Crafted with Care."]} delay={0.15} />
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
              className="font-sans text-sm sm:text-lg text-ink-soft max-w-xl mt-3 sm:mt-4 leading-relaxed">
              Discover the authentic flavours of India through carefully selected spices, traditional recipes and handcrafted artisanal foods. At AMYA, we believe exceptional food begins with exceptional ingredients.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-5 sm:mt-7 flex flex-col sm:flex-row gap-3">
              <Btn to="/shop" variant="solid" data-testid="hero-shop-btn">
                Explore Our Collection <ArrowRight size={15} />
              </Btn>
              <Btn to="/our-story" variant="outline" data-testid="hero-story-btn">
                Our Story
              </Btn>
            </motion.div>
          </div>

          {/* Decorative image — desktop only to keep mobile hero compact */}
          <div className="hidden lg:block lg:col-span-5">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.9 }}
              className="relative aspect-[4/5] overflow-hidden rounded-t-[110px] border border-ink/10 bg-ivory">
              <motion.img src={HERO_IMG} alt="AMYA Indian spices" style={{ y }} className="h-full w-full object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OurCollection() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then(({ data }) => setProducts(data)).catch(() => {});
  }, []);

  const AVAILABLE_ORDER = [
    "cashew-brittle",
    "amya-nuvvula-podi",
    "amya-karivepaku-podi",
    "amya-nallakaram",
    "guntur-sannam-chilli-powder",
    "amya-turmeric-powder",
  ];
  const available = products
    .filter((p) => p.availability === "available")
    .sort((a, b) => {
      const ia = AVAILABLE_ORDER.indexOf(a.slug);
      const ib = AVAILABLE_ORDER.indexOf(b.slug);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  const comingSoon = products
    .filter((p) => p.availability !== "available")
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <section id="collection" className="bg-ivory" data-testid="shop-products-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-7 pb-8 sm:py-11 lg:py-14">
          <Reveal>
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Available for pre-order</span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink">Shop Our Products.</h2>
                <p className="font-sans text-sm sm:text-base text-ink-soft mt-3 max-w-2xl leading-relaxed">Discover handcrafted favourites from AMYA.</p>
                <p className="font-sans text-xs sm:text-sm text-ink-soft mt-2 max-w-2xl leading-relaxed">Made in limited quantities. Place your enquiry or pre-order to check availability.</p>
              </div>
              <Link to="/shop" className="link-underline hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="collection-viewall">
                View all <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {available.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {comingSoon.length > 0 && (
        <section className="bg-beige" data-testid="coming-soon-section">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-11 lg:py-14">
            <Reveal>
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Launching soon</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink">Coming Soon.</h2>
              <p className="font-sans text-sm sm:text-base text-ink-soft mt-3 max-w-2xl leading-relaxed">More of AMYA is on its way.</p>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
              {comingSoon.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

const ORDER_STEPS = [
  { icon: MessageCircle, t: "Tap to order", d: "Choose a pack and tap “Order on WhatsApp” — your selection is pre-filled." },
  { icon: PackageCheck, t: "We confirm", d: "We confirm availability and the final amount with you." },
  { icon: Truck, t: "Delivery", d: "Delivery / courier charges are shared and confirmed before dispatch." },
];

const WHY = [
  { icon: Eye, t: "Watch oils being made", d: "Request a live WhatsApp video call to observe our oil preparation, subject to availability." },
  { icon: ShieldCheck, t: "Small batches", d: "Made in small quantities, with clear information about what goes in." },
  { icon: MessageSquare, t: "Ask before you buy", d: "Talk to us directly on WhatsApp and get your questions answered." },
];

export default function Home() {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const phone = config?.business?.phone || "9675334567";

  return (
    <div>
      <Hero />

      <section className="bg-ivory-warm" data-testid="preorder-band">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-12 lg:py-16">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Pre-order · small batch</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink">Small Batches. Unforgettable Taste.</h2>
            <p className="font-sans text-sm sm:text-base text-ink-soft mt-4 max-w-2xl leading-relaxed">
              At AMYA, we make our products in limited quantities and primarily on a pre-order basis. Every batch is prepared with care, because we believe good food deserves attention, not mass production.
            </p>
            <p className="font-serif text-lg sm:text-xl text-ink mt-5 max-w-2xl leading-relaxed">
              Our confidence is simple: once you taste AMYA, we believe you'll want to come back for more.
            </p>
          </Reveal>
        </div>
      </section>

      <OurCollection />

      {/* How ordering works */}
      <section className="bg-beige">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 lg:py-12">
          <div className="grid sm:grid-cols-3 gap-6">
            {ORDER_STEPS.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.07}>
                <div className="flex gap-3 items-start">
                  <s.icon size={20} className="text-terracotta shrink-0 mt-1" />
                  <div>
                    <h3 className="font-serif text-xl">{s.t}</h3>
                    <p className="font-sans text-sm text-ink-soft mt-0.5 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="font-sans text-xs text-ink-soft mt-6">
            Online checkout isn't active yet — we take orders on WhatsApp and confirm payment directly. International shipping is quoted individually.
          </p>
        </div>
      </section>

      {/* Why AMYA — brand story */}
      <section className="bg-ivory">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-11 lg:py-14">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Why AMYA</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 mb-8 text-ink">Genuine, not glossy.</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {WHY.map((w, i) => (
              <Reveal key={w.t} delay={i * 0.08}>
                <div className="border-t border-ink/15 pt-5">
                  <w.icon size={22} className="text-terracotta" />
                  <h3 className="font-serif text-2xl mt-3 text-ink">{w.t}</h3>
                  <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">{w.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* About + Contact */}
      <section className="bg-terracotta text-ivory grain relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-11 lg:py-14 relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/70">About AMYA</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-[1.0]">A founder-led brand by Amulya Nimmala.</h2>
            <p className="font-sans text-base text-ivory/85 mt-4 max-w-lg leading-relaxed">
              We start small and focus on a limited, carefully made range — helping you understand what you buy and how
              it's prepared. <Link to="/about" className="link-underline">More about AMYA</Link>.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Btn as="a" href={waLink(wa, "Hello AMYA, I'd like to place an order.")} target="_blank" rel="noreferrer" variant="solidIvory" data-testid="home-contact-whatsapp" data-wa-cta>
                <MessageCircle size={15} /> Order on WhatsApp
              </Btn>
              <Btn as="a" href={telHref(phone)} variant="outlineIvory" data-testid="home-contact-call">
                <Phone size={15} /> {formatPhoneIN(phone)}
              </Btn>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

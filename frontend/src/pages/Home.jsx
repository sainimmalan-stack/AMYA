import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Eye, MessageSquare, ShieldCheck, MessageCircle, Phone, PackageCheck, Truck } from "lucide-react";
import { api, waLink } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import { Reveal, MaskedLines } from "@/components/Reveal";
import Btn from "@/components/Btn";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/355a2d711b475e647f4a4a0607d9de6b7442e80cae73e64ea1c5e36c61d914cf.jpeg";
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
              Handmade · small batches
            </motion.span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.0] tracking-tight text-ink">
              <MaskedLines lines={["Small-batch food,", "made with intention."]} delay={0.15} />
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
              className="font-sans text-base sm:text-lg text-ink-soft max-w-xl mt-4 leading-relaxed">
              Discover handcrafted cashew brittle and thoughtfully prepared cooking oils from AMYA.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-7">
              <Btn to="/shop" variant="solid" data-testid="hero-shop-btn">
                Shop our products <ArrowRight size={15} />
              </Btn>
            </motion.div>
          </div>

          {/* Decorative image — desktop only to keep mobile hero compact */}
          <div className="hidden lg:block lg:col-span-5">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.9 }}
              className="relative aspect-[4/5] overflow-hidden rounded-t-[110px] border border-ink/10 bg-ivory">
              <motion.img src={HERO_IMG} alt="AMYA cooking oil" style={{ y }} className="h-full w-full object-contain" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollectionCard({ product, name, desc, price, cta, to, extra, index, tone = "ivory", fit = "contain" }) {
  const img = product?.images?.[0];
  const badge = product?.availability === "available" ? "Available" : "Coming soon";
  const cardBg = tone === "beige" ? "bg-ivory-warm" : "bg-ivory";
  const imgBg = tone === "beige" ? "bg-beige" : "bg-ivory-warm";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      className={`flex flex-col ${cardBg} border border-ink/10 overflow-hidden rounded-xl shadow-sm`}
      data-testid={`collection-card-${to.split("/").pop()}`}
    >
      <div className={`relative aspect-[4/3] ${imgBg}`}>
        {img && (
          <img src={img} alt={name} loading="lazy"
               className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain p-3"}`} />
        )}
        <span className="absolute top-3 left-3 bg-terracotta text-ivory px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] rounded-full">{badge}</span>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-serif text-xl sm:text-2xl text-ink leading-tight">{name}</h3>
        <p className="font-sans text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">{desc}</p>
        {price && <p className="font-sans text-sm text-terracotta-deep mt-2 font-medium">{price}</p>}
        <div className="mt-auto pt-4">
          <Link to={to} data-testid={`collection-cta-${to.split("/").pop()}`} data-wa-cta
                className="inline-flex w-full items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors px-3 py-3 font-sans text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] leading-tight text-center rounded-full">
            <span>{cta}</span> <ArrowRight size={14} className="shrink-0" />
          </Link>
          {extra}
        </div>
      </div>
    </motion.div>
  );
}

function OurCollection() {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const [cashew, setCashew] = useState(null);
  const [oil, setOil] = useState(null);

  useEffect(() => {
    api.get("/products/cashew-brittle").then(({ data }) => setCashew(data)).catch(() => {});
    api.get("/products?category=oils").then(({ data }) => setOil(data[0])).catch(() => {});
  }, []);

  const cashewMin = (cashew?.pack_sizes || []).map((s) => s.price).filter((x) => x != null);
  const priceLabel = cashewMin.length ? `From ₹${Math.min(...cashewMin)}` : null;

  return (
    <section id="collection" className="bg-ivory">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-12 sm:py-14 lg:py-20">
      <Reveal>
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Shop</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2">Our collection.</h2>
          </div>
          <Link to="/shop" className="link-underline hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="collection-viewall">
            View all <ArrowRight size={14} />
          </Link>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
        <CollectionCard
          product={cashew}
          name="AMYA Cashew Brittle"
          desc="Premium whole roasted cashews dipped in jaggery."
          price={priceLabel}
          cta="Shop Cashew Brittle"
          to="/product/cashew-brittle"
          index={0}
          tone="ivory"
          fit="cover"
        />
        <CollectionCard
          product={oil}
          name="AMYA Oils"
          desc="Thoughtfully prepared cooking oils you can watch being made."
          price={null}
          cta="Discover AMYA Oils"
          to="/shop/oils"
          index={1}
          tone="beige"
          extra={
            <a href={waLink(wa, VIDEO_MSG)} target="_blank" rel="noreferrer" data-testid="collection-video-call" data-wa-cta
               className="mt-3 inline-flex items-center justify-center gap-1.5 w-full font-sans text-[10px] uppercase tracking-[0.18em] text-terracotta-deep hover:text-terracotta">
              <MessageCircle size={13} /> Video call enquiries
            </a>
          }
        />
      </div>
      </div>
    </section>
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
      <OurCollection />

      {/* How ordering works */}
      <section className="bg-beige">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-14">
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
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Why AMYA</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 mb-10 text-ink">Genuine, not glossy.</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-8">
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
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20 relative z-10 grid lg:grid-cols-2 gap-10 items-center">
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
              <Btn as="a" href={`tel:${phone}`} variant="outlineIvory" data-testid="home-contact-call">
                <Phone size={15} /> {phone}
              </Btn>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

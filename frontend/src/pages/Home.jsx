import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Eye, MessageSquare, ShieldCheck, Camera, MessageCircle, Phone, PackageCheck, Truck } from "lucide-react";
import { api, waLink } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import { Reveal, MaskedLines } from "@/components/Reveal";
import Btn from "@/components/Btn";
import CashewFeature from "@/components/CashewFeature";

const CASHEW_IMG = "https://images.unsplash.com/photo-1772984960196-b387b4f2f524?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -80 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative bg-terracotta text-ivory grain overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-14 lg:pt-20 lg:pb-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
              className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/75 block mb-5">
              AMYA · Artisanal Foods
            </motion.span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.0] tracking-tight">
              <MaskedLines lines={["Small-batch food,", "made with intention."]} delay={0.2} />
            </h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
              className="font-sans text-base sm:text-lg text-ivory/85 max-w-xl mt-5 leading-relaxed">
              Handmade cashew brittle, and cooking oils you can watch being made. Order in seconds on WhatsApp.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 mt-8">
              <Btn as="button" type="button" onClick={() => scrollTo("cashew")} variant="solidIvory" data-testid="hero-cashew-btn">
                Shop Cashew Brittle <ArrowRight size={15} />
              </Btn>
              <Btn as="button" type="button" onClick={() => scrollTo("oils")} variant="outlineIvory" data-testid="hero-oils-btn">
                Explore AMYA Oils
              </Btn>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1 }}
              className="relative aspect-[3/4] overflow-hidden rounded-t-[110px] border border-ivory/20">
              <motion.img src={CASHEW_IMG} alt="AMYA cashew brittle" style={{ y, scale }} className="h-full w-full object-cover" />
            </motion.div>
          </div>
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

function OilsSecondary() {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const [oils, setOils] = useState([]);
  useEffect(() => { api.get("/products?category=oils").then(({ data }) => setOils(data)); }, []);

  return (
    <section id="oils" className="bg-terracotta text-ivory grain relative overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-24 relative z-10">
        <Reveal>
          <div className="max-w-3xl">
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/70">AMYA Oils · coming soon</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-[1.0]">See your oil being made.</h2>
            <p className="font-sans text-base text-ivory/85 mt-5 leading-relaxed">
              Our oils are made on our own mechanical oil-expeller setup. Request a WhatsApp video call to watch the
              actual process and ask your questions. Oils are <strong>coming soon — enquire for availability</strong>.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 mt-10 items-start">
          {/* Machinery clean placeholder until real photo uploaded */}
          <Reveal>
            <div data-testid="machinery-image-area"
                 className="relative aspect-[4/3] rounded-br-[70px] border border-dashed border-ivory/40 bg-terracotta-deep/40 flex flex-col items-center justify-center text-center px-8">
              <Camera size={28} className="text-ivory/70" />
              <p className="font-serif text-2xl mt-3">Our oil-expeller machinery</p>
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ivory/60 mt-2">Actual facility photograph — coming soon</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {oils.map((o) => (
                <Link key={o.id} to={`/product/${o.slug}`} data-testid={`oil-mini-${o.slug}`} className="group block bg-ivory/5 border border-ivory/15 p-3">
                  <div className="aspect-square overflow-hidden bg-ivory/10">
                    {o.images?.[0] && <img src={o.images[0]} alt={o.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </div>
                  <p className="font-serif text-lg mt-2">{o.name}</p>
                  <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-ivory/60">Coming soon</p>
                </Link>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Btn as="a" href={waLink(wa, "Hello AMYA, I'd like to enquire about your cooking oils and availability.")} target="_blank" rel="noreferrer" variant="solidIvory" data-testid="oils-enquire-wa">
                <MessageCircle size={15} /> Enquire about oils
              </Btn>
              <Btn to="/live-press" variant="outlineIvory" data-testid="oils-book-btn">Book a live oil session</Btn>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const phone = config?.business?.phone || "9675334567";

  return (
    <div>
      <Hero />

      {/* Cashew — priority product */}
      <div id="cashew" className="scroll-mt-24"><CashewFeature /></div>

      {/* How ordering works */}
      <section className="bg-ivory-warm">
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

      {/* Oils secondary */}
      <OilsSecondary />

      {/* Why AMYA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-24">
        <Reveal>
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Why AMYA</span>
          <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mt-3 mb-10">Genuine, not glossy.</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-8">
          {WHY.map((w, i) => (
            <Reveal key={w.t} delay={i * 0.08}>
              <div className="border-t border-ink/15 pt-5">
                <w.icon size={22} className="text-terracotta" />
                <h3 className="font-serif text-2xl mt-3">{w.t}</h3>
                <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">{w.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* About + Contact */}
      <section className="bg-terracotta text-ivory grain relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-20 relative z-10 grid lg:grid-cols-2 gap-10 items-center">
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
              <Btn as="a" href={waLink(wa, "Hello AMYA, I'd like to place an order.")} target="_blank" rel="noreferrer" variant="solidIvory" data-testid="home-contact-whatsapp">
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

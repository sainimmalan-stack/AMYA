import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Eye, MessageSquare, ShieldCheck, MessageCircle, Phone, PackageCheck, Truck, ChefHat, Leaf, Package, Clock } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-4 pb-5 lg:pt-16 lg:pb-16 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">          <div className="lg:col-span-7">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
              className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta block mb-4">
              Authentic ingredients · Traditional recipes
            </motion.span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.0] tracking-tight text-ink">
              <MaskedLines lines={["Tradition You Can Taste.", "Quality You Can Trust."]} delay={0.15} />
            </h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
              className="max-w-xl mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <p className="font-sans text-sm sm:text-base text-ink-soft leading-relaxed">
                Discover the flavours of India with AMYA — from signature cashew brittles and traditional podis to carefully blended spices and thoughtfully sourced cooking oils.
              </p>
              <p className="font-sans text-sm sm:text-base text-ink-soft leading-relaxed">
                Made in small batches with carefully selected ingredients, every AMYA product brings traditional flavours to your table.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-4 sm:mt-7 flex flex-col sm:flex-row gap-3">
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

  // Single explicit order driven by each product's sort_order (set in the backend).
  // All products stay visible regardless of availability status.
  const ordered = [...products].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="collection" className="bg-ivory" data-testid="shop-products-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5 pb-6 sm:py-11 lg:py-14">
        <Reveal>
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Shop AMYA</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink">Our Products</h2>
              <p className="font-sans text-sm sm:text-base text-ink-soft mt-3 max-w-2xl leading-relaxed">Authentic flavours. Carefully crafted in small batches.</p>
            </div>
            <Link to="/shop" className="link-underline hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="collection-viewall">
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {ordered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}

const AMYA_DIFF = [
  { icon: ChefHat, t: "Traditional Recipes", d: "Familiar Indian flavours inspired by tradition." },
  { icon: Leaf, t: "Selected Ingredients", d: "Chosen for flavour, aroma and quality." },
  { icon: Package, t: "Small-Batch Preparation", d: "Prepared in limited quantities with care." },
  { icon: Clock, t: "Made Fresh to Order", d: "Prepared to order, with dispatch typically on Day 3 where applicable." },
];

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

      {/* The AMYA Difference — compact trust band */}
      <section className="bg-ivory border-b border-ink/5" data-testid="amya-difference">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7 sm:py-11">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">The AMYA Difference</span>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 sm:gap-6 mt-5 sm:mt-6">
            {AMYA_DIFF.map((f, i) => (
              <Reveal key={f.t} delay={i * 0.06}>
                <div className="flex flex-col gap-2">
                  <f.icon size={20} className="text-terracotta shrink-0" />
                  <h3 className="font-serif text-base sm:text-lg text-ink leading-tight">{f.t}</h3>
                  <p className="font-sans text-xs sm:text-sm text-ink-soft leading-relaxed">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <OurCollection />

      {/* Small-batch brand statement */}
      <section className="bg-ivory-warm" data-testid="small-batch-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-9 sm:py-12 lg:py-14">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Crafted in small batches</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink">Small Batches. Unforgettable Taste.</h2>
            <p className="font-sans text-sm sm:text-base text-ink-soft mt-4 max-w-3xl leading-relaxed">
              At AMYA, we bring together traditional recipes, carefully selected ingredients and handcrafted foods. Our podis and spice blends are prepared fresh against orders, while our signature cashew brittles are prepared and delivered according to your location. Our cooking oils follow their own availability and ordering schedule.
            </p>
          </Reveal>
        </div>
      </section>

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

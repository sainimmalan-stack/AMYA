import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle, Phone, PackageCheck, Truck } from "lucide-react";
import { api, waLink, telHref, formatPhoneIN } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import { Reveal, MaskedLines } from "@/components/Reveal";
import Btn from "@/components/Btn";
import ProductCard from "@/components/ProductCard";

const HERO_IMG = "/products/amya-hero.jpg?v=2";

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <section ref={ref} className="relative bg-ivory-warm text-ink overflow-hidden border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-6 pb-7 lg:pt-12 lg:pb-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">          <div className="lg:col-span-7">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
              className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.28em] text-terracotta block mb-3">
              Made to order · Prepared in small batches
            </motion.span>
            <h1 className="font-serif text-[2.625rem] sm:text-5xl lg:text-6xl leading-[1.08] sm:leading-[1.05] tracking-tight text-ink [text-wrap:balance]">
              <MaskedLines lines={["Tradition You Can Taste."]} delay={0.15} />
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
              className="font-sans text-[15px] sm:text-lg text-ink-soft max-w-md sm:max-w-xl mt-4 leading-[1.6] [text-wrap:pretty]">
              From traditional Andhra pickles and flavourful podis to carefully selected spices and signature cashew brittles, every batch is prepared with care, rooted in tradition and made to be shared.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Btn as="button" variant="solid" onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })} className="py-[20px] w-full sm:w-auto justify-center" data-testid="hero-shop-btn">
                Shop Our Collection <ArrowRight size={15} />
              </Btn>
              <Link to="/our-story" data-testid="hero-story-btn"
                className="link-underline font-sans text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-terracotta transition-colors self-center sm:self-auto">
                Our Story
              </Link>
            </motion.div>
          </div>

          {/* Decorative image — desktop only to keep mobile hero compact */}
          <div className="hidden lg:block lg:col-span-5">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.9 }}
              className="relative aspect-[4/5] overflow-hidden rounded-t-[110px] border border-ink/10 bg-ivory">
              <motion.img src={HERO_IMG} alt="AMYA cashew brittle gold gift box with bowls of podi and spices" style={{ y }} className="h-full w-full object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CATEGORIES = [
  { label: "Artisanal Sweets", to: "/shop/cashew-brittles" },
  { label: "Podis & Spices", to: "/shop/spices" },
  { label: "Pickles", to: "/shop/pickles" },
  { label: "Cooking Oils", to: "/shop/oils" },
];

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
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-4 pb-8 sm:py-12 lg:py-14">
        <Reveal>
          <div className="flex items-end justify-between mb-2.5 sm:mb-4">
            <div>
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Shop AMYA</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink">Our Products</h2>
              <p className="font-sans text-[15px] sm:text-base text-ink-soft mt-2 max-w-xs sm:max-w-2xl leading-relaxed [text-wrap:balance]">Thoughtful ingredients. Familiar flavours. Made with care.</p>
            </div>
            <Link to="/shop" className="link-underline hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink" data-testid="collection-viewall">
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>

        {/* Category quick links — only categories with real products */}
        <Reveal>
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6" data-testid="category-links">
            {CATEGORIES.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                data-testid={`category-link-${c.to.split("/").pop()}`}
                className="inline-flex items-center rounded-full border border-ink/15 bg-ivory-warm px-3.5 py-1.5 font-sans text-[11px] sm:text-xs uppercase tracking-[0.12em] text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {ordered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
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

const RECIPE_CREDITS = [
  { eyebrow: "By Amulya's Mother-in-Law", title: "Traditional Family Recipes", body: "Nuvvula Podi, Avakai and Magai follow the traditional family recipes of Amulya's mother-in-law, Leela, shaped by more than 30 years of cooking experience." },
  { eyebrow: "By Ammu", title: "Pickle Specialities", body: "Our non-vegetarian pickles — chicken, mutton and prawn — are prepared by Ammu, with a passion for deep, satisfying flavours." },
  { eyebrow: "Ammu's Ammamma", title: "A Recipe Passed Down", body: "Sweet Allam Pickle comes from Ammu's Ammamma's family recipe — a much-loved taste passed down through generations." },
];

export default function Home() {
  const { config } = useConfig();
  const { hash } = useLocation();
  const wa = config?.business?.whatsapp || "919675334567";
  const phone = config?.business?.phone || "9675334567";

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      const t = setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
      return () => clearTimeout(t);
    }
  }, [hash]);

  return (
    <div>
      <Hero />

      {/* Compact trust line */}
      <div className="bg-ivory border-b border-ink/5" data-testid="trust-line">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 py-2.5 sm:py-3">
          <p className="font-sans text-[8.5px] min-[400px]:text-[9.5px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.22em] text-ink-soft flex flex-nowrap sm:flex-wrap items-center justify-center gap-x-1.5 gap-y-1 whitespace-nowrap">
            <span className="whitespace-nowrap">Traditional Recipes</span>
            <span className="text-terracotta">·</span>
            <span className="whitespace-nowrap">Made to Order</span>
            <span className="text-terracotta">·</span>
            <span className="whitespace-nowrap">Pan-India Delivery</span>
          </p>
        </div>
      </div>

      {/* Products appear immediately */}
      <OurCollection />

      {/* Prepared with care, after you order */}
      <section id="prepared-with-care" className="bg-beige scroll-mt-24" data-testid="prepared-with-care-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-14 lg:py-16">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Our Philosophy</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink [text-wrap:balance]">Prepared With Care, After You Order</h2>
            <div className="mt-5 max-w-3xl space-y-4 font-sans text-sm sm:text-base text-ink-soft leading-relaxed">
              <p>At AMYA, good food cannot be rushed. We prepare your order after it is placed, giving us the time to focus on the ingredients, preparation, and care that go into every batch.</p>
              <p>We believe our customers deserve food made with attention, not mass-produced in a hurry.</p>
              <p className="text-ink font-medium">Our standard delivery commitment is the third day after your order is placed. Please allow this preparation time so we can give your order the care it deserves.</p>
              <p>We appreciate your patience and your trust in our kitchen.</p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-6 mt-9">
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
          <p className="font-sans text-xs text-ink-soft mt-7 max-w-3xl leading-relaxed">
            The third-day commitment covers our preparation and dispatch; actual delivery time also depends on your location and the courier. Online checkout isn't active yet — we take orders on WhatsApp and confirm payment directly. International shipping is quoted individually.
          </p>
        </div>
      </section>

      {/* The Heart Behind AMYA — family story */}
      <section id="our-family" className="bg-ivory-warm scroll-mt-24" data-testid="heart-behind-amya-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Our Family</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink [text-wrap:balance]">The Heart Behind AMYA</h2>
          </Reveal>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 mt-6">
            <Reveal>
              <div className="space-y-4 font-sans text-sm sm:text-base text-ink-soft leading-relaxed">
                <p>AMYA is not simply a business selling food. It was born from Amulya's genuine love of cooking and her desire to share the food she loves making.</p>
                <p>Amulya, affectionately known as Ammu, is passionate about preparing delicious food. She is building AMYA around the belief that the best food comes from a genuine love of cooking, thoughtfully selected ingredients, and recipes that carry memories.</p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="space-y-4 font-sans text-sm sm:text-base text-ink-soft leading-relaxed">
                <p>Her mother-in-law, Leela, shares the same passion for cooking. She supports AMYA by helping source quality raw materials from across India and by bringing decades of cooking experience and traditional recipes to the kitchen.</p>
                <p>Together, Amulya and her mother-in-law bring different strengths to AMYA: a passion for preparing delicious food, an appreciation for traditional recipes, and a commitment to selecting ingredients carefully.</p>
                <p>AMYA is our way of sharing this family passion with your home.</p>
              </div>
            </Reveal>
          </div>
          <Reveal>
            <p className="font-serif text-xl sm:text-2xl lg:text-3xl text-terracotta mt-10 max-w-3xl leading-snug [text-wrap:balance]">More than a food brand, AMYA is a family kitchen sharing the flavours, recipes, and traditions we love.</p>
          </Reveal>

          {/* Good food starts with good ingredients */}
          <Reveal>
            <div className="mt-10 rounded-xl border border-terracotta/20 bg-ivory px-6 py-7 sm:px-8 sm:py-8 max-w-3xl" data-testid="ingredient-sourcing">
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Sourcing</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-ink mt-2 leading-tight [text-wrap:balance]">Good Food Starts With Good Ingredients</h3>
              <div className="mt-3 space-y-3 font-sans text-sm sm:text-base text-ink-soft leading-relaxed">
                <p>Behind every memorable recipe is the care taken in choosing its ingredients. Amulya's mother-in-law helps AMYA source quality raw materials from across India, bringing her experience and attention to ingredient selection into the process.</p>
                <p>We believe that thoughtful sourcing is an important part of preparing food we are proud to share.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Recipes with a story */}
      <section className="bg-ivory" data-testid="recipes-with-a-story-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-14 lg:py-16">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Heritage</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 text-ink [text-wrap:balance]">Recipes With a Story</h2>
            <p className="font-sans text-sm sm:text-base text-ink-soft mt-3 max-w-2xl leading-relaxed">AMYA's recipes come from the people who love preparing them — each one carries its own family story.</p>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-5 mt-8">
            {RECIPE_CREDITS.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.07}>
                <div className="h-full rounded-xl border border-beige bg-ivory-warm px-6 py-6">
                  <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-terracotta">{r.eyebrow}</p>
                  <h3 className="font-serif text-xl sm:text-2xl text-ink mt-2 leading-tight">{r.title}</h3>
                  <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">{r.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <Link to="/our-story" className="link-underline inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink mt-8" data-testid="recipes-story-link">
              More about AMYA <ArrowRight size={14} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-terracotta text-ivory grain relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-11 lg:py-14 relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/70">Order with us</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-[1.0]">Ready to taste tradition?</h2>
            <p className="font-sans text-base text-ivory/85 mt-4 max-w-lg leading-relaxed">
              Build your order and send it to us on WhatsApp — we'll confirm availability, pricing and delivery before dispatch.
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

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, MessageCircle, Video, Phone, MapPin, Check } from "lucide-react";
import { api, waLink, telHref } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import Availability from "@/components/Availability";
import DietMark from "@/components/DietMark";
import Btn from "@/components/Btn";
import { Reveal } from "@/components/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { config } = useConfig();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [pack, setPack] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const wa = config?.business?.whatsapp || "919675334567";
  const phone = config?.business?.phone || "9675334567";
  const checkoutEnabled = config?.settings?.checkout_enabled;

  useEffect(() => {
    api.get(`/products/${slug}`).then(({ data }) => setProduct(data)).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return (
    <div className="max-w-3xl mx-auto px-5 py-32 text-center">
      <h1 className="font-serif text-4xl text-ink">Product not found</h1>
      <Btn to="/shop" variant="outline" className="mt-8">Back to shop</Btn>
    </div>
  );
  if (!product) return <div className="py-40 text-center font-sans text-ink-soft">Loading…</div>;

  const selected = product.pack_sizes?.[pack];
  const buyable = product.availability === "available";
  const total = selected?.price != null ? selected.price * qty : null;

  const orderMsg = (() => {
    if (!buyable || selected?.price == null) {
      const sizeStr = selected?.label ? ` — ${selected.label}` : "";
      return `Hello AMYA, I'd like to enquire about:\n• ${product.name}${sizeStr}\n\nPlease let me know when it's available and the price.`;
    }
    const pieces = selected?.note ? ` (${selected.note})` : "";
    return (
      `Hello AMYA, I'd like to order:\n` +
      `• ${product.name}\n` +
      `• Pack: ${selected.label}${pieces}\n` +
      `• Quantity: ${qty} pack${qty > 1 ? "s" : ""}\n` +
      `• Total: ₹${total.toLocaleString("en-IN")}\n\n` +
      `Please confirm availability, delivery and payment.`
    );
  })();

  return (
    <div data-testid="product-detail">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6">
        <button onClick={() => navigate(-1)} data-testid="pd-back"
                className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-terracotta">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-6 lg:py-14 grid lg:grid-cols-2 gap-6 lg:gap-16">
        {/* Gallery */}
        <div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
                      className="relative aspect-[4/3] lg:aspect-[4/5] overflow-hidden bg-ivory-warm rounded-xl">
            {product.images?.[activeImg] ? (
              <img src={product.images[activeImg]} alt={product.name} className={`h-full w-full ${["spices", "pickles"].includes(product.category) ? "object-cover" : "object-contain"}`} />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-serif text-7xl text-terracotta/25">AMYA</div>
            )}
            <div className="absolute top-4 left-4"><Availability status={product.availability} /></div>
          </motion.div>
          {product.images?.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((im, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                        className={`h-20 w-20 overflow-hidden border ${i === activeImg ? "border-terracotta" : "border-ink/10"}`}>
                  <img src={im} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <Reveal>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs uppercase tracking-[0.25em] text-terracotta">{product.category.replace("-", " ")}</span>
              {product.diet && <DietMark diet={product.diet} />}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight mt-2 leading-tight text-ink">{product.name}</h1>
            {product.origin && (
              <p className="font-sans text-xs text-ink-soft mt-2 inline-flex items-center gap-1.5"><MapPin size={13} className="text-terracotta" /> {product.origin}</p>
            )}
            <p className="font-sans text-sm sm:text-base text-ink-soft mt-2 leading-relaxed whitespace-pre-line">{product.short_description}</p>
          </Reveal>

          {product.highlights?.length > 0 && (
            <ul className="mt-4 grid gap-2" data-testid="pd-highlights">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 font-sans text-sm text-ink-soft">
                  <Check size={15} className="text-terracotta shrink-0 mt-0.5" /> {h}
                </li>
              ))}
            </ul>
          )}

          {/* Pack sizes */}
          {product.pack_sizes?.length > 0 && (
            <div className="mt-5">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft mb-2">Pack size</p>
              <div className="grid grid-cols-2 gap-3">
                {product.pack_sizes.map((ps, i) => {
                  const active = i === pack;
                  const isGift = i === product.pack_sizes.length - 1 && product.pack_sizes.length > 1;
                  return (
                    <button key={i} onClick={() => setPack(i)} data-testid={`pack-${i}`}
                            aria-pressed={active}
                            className={`relative flex flex-col items-center justify-center text-center px-3 py-3.5 border transition-all duration-300 rounded-md ${active ? "border-terracotta bg-terracotta text-ivory" : "border-ink/15 bg-ivory text-ink hover:border-terracotta/60"}`}>
                      {isGift && (
                        <span data-testid="gifting-tag"
                              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm ${active ? "bg-ivory text-terracotta" : "bg-terracotta text-ivory"}`}>
                          Perfect for gifting
                        </span>
                      )}
                      <span className="font-serif text-xl sm:text-2xl leading-none">{ps.label}</span>
                      {ps.price != null ? (
                        <span className={`font-sans text-lg sm:text-xl font-medium mt-1 whitespace-nowrap ${active ? "text-ivory" : "text-terracotta"}`}>₹{ps.price.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="font-sans text-sm mt-1">Price at launch</span>
                      )}
                      {ps.note && <span className={`font-sans text-[10px] uppercase tracking-[0.16em] mt-1 ${active ? "text-ivory/80" : "text-ink-soft"}`}>{ps.note}</span>}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const last = product.pack_sizes[product.pack_sizes.length - 1];
                if (!last || last.price == null || product.pack_sizes.length < 2) return null;
                const m = String(last.label).match(/([\d.]+)\s*(kg|g)/i);
                const grams = m ? (m[2].toLowerCase() === "kg" ? parseFloat(m[1]) * 1000 : parseFloat(m[1])) : null;
                if (!grams) return null;
                const perG = last.price / grams;
                return (
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <div aria-hidden="true" />
                    <p data-testid="best-value-note" className="text-center font-sans text-[10px] tracking-[0.1em] text-terracotta-deep">
                      Best value · ₹{perG.toFixed(2)}/g
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quantity + live total */}
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft">Quantity</p>
              <div className="inline-flex items-center border border-ink/20 rounded-md overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} data-testid="qty-minus" className="h-10 w-10 flex items-center justify-center hover:bg-ivory-warm"><Minus size={15} /></button>
                <span data-testid="qty-value" className="w-10 text-center font-sans">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} data-testid="qty-plus" className="h-10 w-10 flex items-center justify-center hover:bg-ivory-warm"><Plus size={15} /></button>
              </div>
            </div>
            {buyable && total != null && (
              <div className="text-right">
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft">Total</p>
                <p data-testid="pd-total" className="font-serif text-2xl text-terracotta leading-none mt-0.5">₹{total.toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {/* Primary order button */}
          <a href={waLink(wa, orderMsg)} target="_blank" rel="noreferrer" data-testid="pd-whatsapp-enquiry" data-wa-cta
             className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full">
            <MessageCircle size={18} /> {buyable ? "Order on WhatsApp" : product.availability === "coming-soon" ? "Enquire for launch updates" : "Enquire on WhatsApp"}
          </a>

          {/* Secondary actions */}
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            {product.live_press && (
              <Btn to={`/live-press?oil=${product.slug}`} variant="outline" data-testid="pd-book-livepress">
                <Video size={15} /> Book AMYA Live Press
              </Btn>
            )}
            <Btn as="a" href={telHref(phone)} variant="outline" data-testid="pd-call">
              <Phone size={15} /> Call support
            </Btn>
          </div>

          {/* Pre-launch notice — below the ordering section */}
          {!checkoutEnabled && (
            <div className="mt-5 border border-ink/15 bg-ivory-warm/50 px-4 py-3" data-testid="pd-prelaunch">
              <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-ink-soft">Pre-launch</p>
              <p className="font-sans text-sm text-ink-soft mt-1">
                Online checkout opens once AMYA confirms the required food-business approvals. For now, tap Order on WhatsApp and we'll help you place your order.
              </p>
            </div>
          )}

          {/* Details accordion */}
          <Accordion type="single" collapsible className="mt-6" defaultValue="desc">
            {product.description && (
              <AccordionItem value="desc">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Description</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">{product.description}</AccordionContent>
              </AccordionItem>
            )}
            {product.extraction_method && (
              <AccordionItem value="extract">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Extraction method</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">{product.extraction_method}</AccordionContent>
              </AccordionItem>
            )}
            {product.ingredients && (
              <AccordionItem value="ingredients">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Ingredients</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">{product.ingredients}</AccordionContent>
              </AccordionItem>
            )}
            {product.storage && (
              <AccordionItem value="storage">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Storage</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">{product.storage}</AccordionContent>
              </AccordionItem>
            )}
            {product.delivery_info && (
              <AccordionItem value="delivery">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Delivery</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">{product.delivery_info}</AccordionContent>
              </AccordionItem>
            )}
            {product.returns_info && (
              <AccordionItem value="returns">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Returns & cancellation</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">{product.returns_info}</AccordionContent>
              </AccordionItem>
            )}
            {product.food_label_info && (
              <AccordionItem value="label">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Food-label information</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">{product.food_label_info}</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </section>
    </div>
  );
}

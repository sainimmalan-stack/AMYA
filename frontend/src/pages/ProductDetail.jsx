import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingBag, Video, Phone, MapPin, Check, Flame } from "lucide-react";
import { api, telHref } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import { useCart } from "@/context/CartContext";
import Availability from "@/components/Availability";
import DietMark from "@/components/DietMark";
import PicklePackMock from "@/components/PicklePackMock";
import Btn from "@/components/Btn";
import { Reveal } from "@/components/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [pack, setPack] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

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
  const orderable = ["ready", "order", "available"].includes(product.availability);
  const total = selected?.price != null ? selected.price * qty : null;

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
              <img src={product.images[activeImg]} alt={product.name} className={`h-full w-full object-center ${product.category === "pickles" ? "object-cover" : product.category === "spices" ? "object-contain p-6 sm:p-10" : "object-contain"}`} />
            ) : product.category === "pickles" ? (
              <PicklePackMock name={product.name} />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-serif text-7xl text-terracotta/25">AMYA</div>
            )}
            {product.diet && <div className="absolute top-4 right-4"><DietMark diet={product.diet} /></div>}
            {product.availability === "coming-soon" && (
              <div className="absolute top-4 left-4"><Availability status={product.availability} /></div>
            )}
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
            {product.slug !== "cashew-brittle" && (
              <h1 className="font-serif text-3xl sm:text-4xl tracking-tight mt-2 leading-tight text-ink">{product.name}</h1>
            )}
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

          {product.serving && (
            <div className="mt-5 rounded-lg border border-terracotta/25 bg-terracotta/5 px-4 py-4" data-testid="pd-serving">
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-terracotta">How to enjoy</p>
              <p className="font-sans text-sm text-ink mt-1.5 leading-relaxed">{product.serving}</p>
              {product.serving_highlight && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-terracotta text-ivory px-4 py-2" data-testid="pd-serving-highlight">
                  <Flame size={14} className="shrink-0" />
                  <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.14em]">{product.serving_highlight}</span>
                </div>
              )}
            </div>
          )}

          {/* Pack sizes */}
          {product.pack_sizes?.length > 0 && (
            <div className="mt-5">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft mb-2">Pack size</p>
              <div className="flex flex-wrap gap-2">
                {product.pack_sizes.map((ps, i) => {
                  const active = i === pack;
                  return (
                    <button key={i} onClick={() => setPack(i)} data-testid={`pack-${i}`}
                            aria-pressed={active}
                            className={`flex-1 min-w-[84px] flex flex-col items-center justify-center text-center px-2 py-2 border rounded-lg transition-all duration-200 ${active ? "border-terracotta bg-terracotta text-ivory" : "border-beige bg-ivory-warm text-ink hover:border-terracotta/60"}`}>
                      <span className="font-serif text-base sm:text-lg leading-none">{ps.label}</span>
                      {ps.price != null ? (
                        <span className={`font-sans text-sm sm:text-base font-medium mt-1 leading-none whitespace-nowrap ${active ? "text-ivory" : "text-terracotta"}`}>₹{ps.price.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="font-sans text-xs mt-1">Enquire</span>
                      )}
                      {ps.note && <span className={`font-sans text-[9px] sm:text-[10px] uppercase tracking-[0.1em] mt-1 leading-none ${active ? "text-ivory/80" : "text-ink-soft"}`}>{ps.note}</span>}
                    </button>
                  );
                })}
              </div>
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
            {orderable && total != null && (
              <div className="text-right">
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft">Total</p>
                <p data-testid="pd-total" className="font-serif text-2xl text-terracotta leading-none mt-0.5">₹{total.toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {/* Primary action */}
          {orderable ? (
            <button
              type="button"
              onClick={() => addItem(product, selected, qty)}
              data-testid="pd-add-cart"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full"
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
          ) : (
            <div
              data-testid="pd-coming-soon"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 border border-terracotta/40 text-terracotta-deep py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full"
            >
              Coming soon
            </div>
          )}

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

          {/* Order-confidence microcopy — shown for made-to-order / ready items */}
          {["ready", "order"].includes(product.availability) && (
            <p className="mt-3 text-center font-sans text-xs sm:text-sm text-ink-soft" data-testid="pd-confidence-note">
              Freshly prepared to order · Dispatch typically on Day 3
            </p>
          )}

          {/* Pre-launch notice — only for products not yet open for ordering */}
          {!checkoutEnabled && !orderable && (
            <div className="mt-5 border border-ink/15 bg-ivory-warm/50 px-4 py-3" data-testid="pd-prelaunch">
              <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-ink-soft">Pre-launch</p>
              <p className="font-sans text-sm text-ink-soft mt-1">
                Online checkout isn't active yet — add items to your cart and send your order on WhatsApp. We'll confirm availability, final pricing and delivery with you.
              </p>
            </div>
          )}

          {/* Preparation & Dispatch */}
          {(product.preparation || product.dispatch) && (
            <div className="mt-5 rounded-lg border border-terracotta/25 bg-ivory-warm/60 px-4 py-4" data-testid="pd-prep-dispatch">
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-terracotta">Preparation & Dispatch</p>
              {product.preparation && <p className="font-sans text-sm text-ink mt-2 leading-relaxed">{product.preparation}</p>}
              {product.dispatch && <p className="font-sans text-sm text-ink mt-1.5 leading-relaxed">{product.dispatch}</p>}
            </div>
          )}

          {/* Delivery information */}
          {product.delivery_details?.length > 0 && (
            <div className="mt-4 rounded-lg border border-terracotta/25 bg-ivory-warm/60 px-4 py-4" data-testid="pd-delivery-info">
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-terracotta">Delivery Information</p>
              <ul className="mt-3 grid gap-3">
                {product.delivery_details.map((d, i) => (
                  <li key={i} className="flex flex-col">
                    <span className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink">{d.region}</span>
                    <span className="font-sans text-sm text-ink-soft mt-0.5 leading-relaxed">{d.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Details accordion */}
          <Accordion type="single" collapsible className="mt-6" defaultValue="desc">
            {product.description && (
              <AccordionItem value="desc">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Description</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed whitespace-pre-line">{product.description}</AccordionContent>
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

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingBag, Video, Phone, Check, MessageCircle, Sparkles, Droplets } from "lucide-react";
import { api, telHref, waLink } from "@/lib/api";
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
  const orderable = ["ready", "order", "available", "in-stock"].includes(product.availability);
  const outOfStock = product.availability === "out-of-stock";
  const showBadge = ["coming-soon", "out-of-stock"].includes(product.availability);
  const total = selected?.price != null ? selected.price * qty : null;
  const hasConfirmedPrice = (product.pack_sizes || []).some((ps) => ps.price != null);
  // Orderable item with no confirmed pricing yet → route to a WhatsApp enquiry instead of the cart.
  const enquireOnly = orderable && !hasConfirmedPrice;
  const enquireHref = waLink("919675334567", `Hello AMYA, I would like to enquire about ${product.name} — please share pack sizes and pricing.`);
  const PODI_SLUGS = ["amya-nuvvula-podi", "amya-karivepaku-podi", "amya-nallakaram"];
  const showServingSuggestion = product.category === "pickles" || PODI_SLUGS.includes(product.slug);

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
            {showBadge && (
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
          {/* A. Name + B. Short description */}
          <Reveal>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans text-xs uppercase tracking-[0.25em] text-terracotta">{product.category.replace("-", " ")}</span>
              {product.signature && (
                <span className="inline-flex items-center gap-1 rounded-full bg-terracotta text-ivory px-2.5 py-0.5 font-sans text-[10px] uppercase tracking-[0.18em]" data-testid="pd-signature-label">
                  <Sparkles size={11} className="shrink-0" /> AMYA Signature
                </span>
              )}
              {product.diet && <DietMark diet={product.diet} />}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2.5 leading-[1.05] text-ink">{product.name}</h1>
            <p className="font-sans text-sm sm:text-base text-ink-soft mt-3 leading-relaxed line-clamp-2 sm:line-clamp-none">{product.short_description}</p>
          </Reveal>

          {/* C. Pack sizes */}
          {product.pack_sizes?.length > 0 && (
            <div className="mt-6">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft mb-2.5">Pack size</p>
              <div className="grid gap-2 sm:gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(88px,1fr))]">
                {product.pack_sizes.map((ps, i) => {
                  const active = i === pack;
                  return (
                    <button key={i} onClick={() => setPack(i)} data-testid={`pack-${i}`}
                            aria-pressed={active}
                            className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3.5 border rounded-xl transition-all duration-200 ${active ? "border-terracotta bg-terracotta text-ivory shadow-sm" : "border-beige bg-ivory-warm text-ink hover:border-terracotta/60"}`}>
                      <span className="font-sans text-[15px] sm:text-base font-semibold leading-none">{ps.label}</span>
                      {ps.price != null ? (
                        <span className={`font-sans text-lg sm:text-xl font-bold tabular-nums leading-none ${active ? "text-ivory" : "text-terracotta"}`}>₹{ps.price.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="font-sans text-sm font-semibold leading-none">Enquire</span>
                      )}
                      <span className={`font-sans text-[10px] font-medium uppercase tracking-[0.08em] leading-none min-h-[11px] ${active ? "text-ivory/75" : "text-ink-soft"}`}>{ps.note || ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* D. Quantity + live total */}
          {orderable && !enquireOnly && (
            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft">Quantity</p>
                <div className="inline-flex items-center border border-ink/20 rounded-md overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} data-testid="qty-minus" className="h-10 w-10 flex items-center justify-center hover:bg-ivory-warm"><Minus size={15} /></button>
                  <span data-testid="qty-value" className="w-10 text-center font-sans text-base font-semibold tabular-nums">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} data-testid="qty-plus" className="h-10 w-10 flex items-center justify-center hover:bg-ivory-warm"><Plus size={15} /></button>
                </div>
              </div>
              {total != null && (
                <div className="text-right">
                  <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft">Total</p>
                  <p data-testid="pd-total" className="font-sans text-2xl font-bold text-terracotta tabular-nums leading-none mt-1">₹{total.toLocaleString("en-IN")}</p>
                </div>
              )}
            </div>
          )}

          {/* E. Primary action */}
          {outOfStock ? (
            <div
              data-testid="pd-out-of-stock"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 border border-ink/20 bg-ink/5 text-ink-soft py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full cursor-not-allowed"
            >
              Currently Unavailable
            </div>
          ) : !orderable ? (
            <div
              data-testid="pd-coming-soon"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 border border-terracotta/40 text-terracotta-deep py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full"
            >
              Coming soon
            </div>
          ) : enquireOnly ? (
            <a
              href={enquireHref}
              target="_blank"
              rel="noreferrer"
              data-testid="pd-enquire-whatsapp"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full"
            >
              <MessageCircle size={18} /> Enquire on WhatsApp
            </a>
          ) : (
            <button
              type="button"
              onClick={() => addItem(product, selected, qty)}
              data-testid="pd-add-cart"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-4 font-sans text-sm uppercase tracking-[0.18em] rounded-full"
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
          )}

          {/* Made to order — compact note below the button */}
          {orderable && (
            <p className="mt-3 font-sans text-xs text-ink-soft leading-relaxed text-center" data-testid="pd-made-to-order">
              Made to order · prepared after your order is placed, with dispatch by the third day.
            </p>
          )}

          {/* Secondary actions */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {product.live_press && (
              <Btn to={`/live-press?oil=${product.slug}`} variant="outline" data-testid="pd-book-livepress">
                <Video size={15} /> Book AMYA Live Press
              </Btn>
            )}
            <Btn as="a" href={telHref(phone)} variant="outline" data-testid="pd-call">
              <Phone size={15} /> Call support
            </Btn>
          </div>

          {/* Out-of-stock restock notice */}
          {outOfStock && (
            <div className="mt-5 border border-ink/15 bg-ivory-warm/50 px-4 py-3" data-testid="pd-out-of-stock-note">
              <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-ink-soft">Out of stock</p>
              <p className="font-sans text-sm text-ink-soft mt-1">
                This product is currently unavailable. Message us on WhatsApp or call and we'll let you know as soon as it's back in stock.
              </p>
            </div>
          )}

          {/* F. Supporting information — below the purchase */}

          {/* Pickles: compact cold-pressed oils line */}
          {product.category === "pickles" && (
            <p className="mt-7 flex items-start gap-2.5 border-t border-beige pt-6 font-sans text-sm text-ink-soft leading-relaxed" data-testid="pd-cold-pressed-oil">
              <Droplets size={16} className="text-terracotta shrink-0 mt-0.5" />
              <span>Made with AMYA cold-pressed oils and traditional Andhra recipes, prepared in small batches with care.</span>
            </p>
          )}

          {/* Our Story & Ingredients */}
          <Accordion type="single" collapsible className={product.category === "pickles" ? "mt-4" : "mt-7 border-t border-beige pt-2"}>
            {product.recipe_story && (
              <AccordionItem value="story">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]" data-testid="pd-story-trigger">Our Story</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed" data-testid="pd-recipe-story">
                  <span className="block font-serif text-base text-ink mb-1.5 normal-case tracking-normal">{product.recipe_story.heading}</span>
                  {product.recipe_story.body}
                </AccordionContent>
              </AccordionItem>
            )}
            {(showServingSuggestion || product.serving) && (
              <AccordionItem value="serving">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Serving Suggestion</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed" data-testid="pd-serving">
                  {showServingSuggestion ? "Best enjoyed with hot rice and a generous spoon of ghee." : product.serving}
                </AccordionContent>
              </AccordionItem>
            )}
            {product.highlights?.length > 0 && (
              <AccordionItem value="highlights">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Highlights</AccordionTrigger>
                <AccordionContent>
                  <ul className="grid gap-1.5" data-testid="pd-highlights">
                    {product.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 font-sans text-sm text-ink-soft">
                        <Check size={15} className="text-terracotta shrink-0 mt-0.5" /> {h}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            {product.description && (
              <AccordionItem value="desc">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Description</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed whitespace-pre-line">{product.description}</AccordionContent>
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
            {(product.preparation || product.dispatch) && (
              <AccordionItem value="prep">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]" data-testid="pd-prep-dispatch">Preparation &amp; Dispatch</AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-ink-soft leading-relaxed">
                  {product.preparation && <p>{product.preparation}</p>}
                  {product.dispatch && <p className="mt-1.5">{product.dispatch}</p>}
                </AccordionContent>
              </AccordionItem>
            )}
            {product.delivery_details?.length > 0 && (
              <AccordionItem value="delivery-regions">
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]" data-testid="pd-delivery-info">Delivery Information</AccordionTrigger>
                <AccordionContent>
                  <ul className="grid gap-3">
                    {product.delivery_details.map((d, i) => (
                      <li key={i} className="flex flex-col">
                        <span className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink">{d.region}</span>
                        <span className="font-sans text-sm text-ink-soft mt-0.5 leading-relaxed">{d.text}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
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
                <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.2em]">Returns &amp; cancellation</AccordionTrigger>
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

          {/* AMYA Quality Promise */}
          <div className="mt-6 rounded-lg border border-beige bg-ivory-warm px-5 py-5" data-testid="pd-quality-promise">
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-terracotta">The AMYA Quality Promise</p>
            <p className="font-serif text-lg text-ink mt-1.5">Your trust. Our promise.</p>
            <p className="font-sans text-sm text-ink-soft mt-1.5 leading-relaxed">Damaged order? Incorrect product? We're here to make it right.</p>
            <Link to="/refund-policy" data-testid="pd-refund-link" className="link-underline inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink mt-3">View Refund &amp; Replacement Policy</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

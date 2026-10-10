import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, MessageCircle, Video, AlertTriangle, Phone } from "lucide-react";
import { api, waLink, orderMessage } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import Availability from "@/components/Availability";
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
  const hasAllergen = product.allergens && product.allergens.trim().length > 0;
  const buyable = product.availability === "available";

  const enquiryMsg = orderMessage(product, selected?.label, selected?.price, qty);

  return (
    <div data-testid="product-detail">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-10">
        <button onClick={() => navigate(-1)} data-testid="pd-back"
                className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-terracotta">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10 lg:py-14 grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery */}
        <div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
                      className="relative aspect-[4/5] overflow-hidden bg-ivory-warm">
            {product.images?.[activeImg] ? (
              <img src={product.images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
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
            <span className="font-sans text-xs uppercase tracking-[0.25em] text-terracotta">{product.category.replace("-", " ")}</span>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight mt-3 leading-tight">{product.name}</h1>
            <p className="font-sans text-base text-ink-soft mt-4 leading-relaxed">{product.short_description}</p>
          </Reveal>

          {/* Pack sizes */}
          {product.pack_sizes?.length > 0 && (
            <div className="mt-8">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft mb-3">Pack size</p>
              <div className="flex flex-wrap gap-3">
                {product.pack_sizes.map((ps, i) => (
                  <button key={i} onClick={() => setPack(i)} data-testid={`pack-${i}`}
                          className={`px-5 py-3 border text-left transition-colors ${i === pack ? "border-terracotta bg-terracotta text-ivory" : "border-ink/20 text-ink hover:border-terracotta"}`}>
                    <span className="block font-sans text-sm">{ps.label}</span>
                    <span className="block font-sans text-xs opacity-80 mt-0.5">
                      {ps.price != null ? `₹${ps.price}` : "Price at launch"}{ps.note ? ` · ${ps.note}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-8">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft mb-3">Quantity</p>
            <div className="inline-flex items-center border border-ink/20">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} data-testid="qty-minus" className="h-12 w-12 flex items-center justify-center hover:bg-ivory-warm"><Minus size={16} /></button>
              <span data-testid="qty-value" className="w-12 text-center font-sans">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} data-testid="qty-plus" className="h-12 w-12 flex items-center justify-center hover:bg-ivory-warm"><Plus size={16} /></button>
            </div>
          </div>

          {/* Allergen */}
          {hasAllergen && (
            <div data-testid="allergen-notice" className="mt-8 flex gap-3 border border-terracotta/40 bg-terracotta/5 p-4">
              <AlertTriangle size={18} className="text-terracotta shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.15em] text-terracotta-deep">Allergen information</p>
                <p className="font-sans text-sm text-ink-soft mt-1">{product.allergens}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {checkoutEnabled && buyable ? (
              <Btn as="button" variant="solid" data-testid="add-to-cart">Add to cart</Btn>
            ) : (
              <div className="w-full">
                <div className="border border-ink/15 bg-ivory-warm/50 px-5 py-4">
                  <p className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft">Pre-launch</p>
                  <p className="font-sans text-sm text-ink-soft mt-1">
                    Online checkout opens once AMYA confirms the required food-business approvals. For now, enquire directly and we'll help you place an order.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Btn as="a" href={waLink(wa, enquiryMsg)} target="_blank" rel="noreferrer" variant="solid" data-testid="pd-whatsapp-enquiry">
              <MessageCircle size={15} /> {buyable ? "Order on WhatsApp" : "Enquire on WhatsApp"}
            </Btn>
            {product.live_press && (
              <Btn to={`/live-press?oil=${product.slug}`} variant="outline" data-testid="pd-book-livepress">
                <Video size={15} /> Book AMYA Live Press
              </Btn>
            )}
            <Btn as="a" href={`tel:${phone}`} variant="outline" data-testid="pd-call">
              <Phone size={15} /> Call support
            </Btn>
          </div>

          {/* Details accordion */}
          <Accordion type="single" collapsible className="mt-10" defaultValue="desc">
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

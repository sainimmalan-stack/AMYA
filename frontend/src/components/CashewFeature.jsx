import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Minus, Plus, AlertTriangle, ArrowRight } from "lucide-react";
import { api, waLink, orderMessage } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";

export default function CashewFeature() {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const [product, setProduct] = useState(null);
  const [pack, setPack] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get("/products/cashew-brittle").then(({ data }) => setProduct(data)).catch(() => {});
  }, []);

  if (!product) return null;
  const selected = product.pack_sizes?.[pack];
  const msg = orderMessage(product, selected?.label, selected?.price, qty);

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 lg:py-24" data-testid="cashew-feature">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden bg-ivory-warm rounded-2xl rounded-tr-[70px]"
        >
          {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-auto max-h-[520px] object-contain mx-auto" />}
          <span className="absolute top-4 left-4 bg-terracotta text-ivory px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Available now</span>
        </motion.div>

        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Our signature product</span>
            <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-3 leading-tight">{product.name}</h2>
            <p className="font-sans text-base text-ink-soft mt-4 leading-relaxed">{product.short_description}</p>
          </motion.div>

          {/* Pack sizes */}
          <div className="mt-7">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft mb-3">Choose a pack</p>
            <div className="grid grid-cols-3 gap-3">
              {product.pack_sizes.map((ps, i) => (
                <button key={i} onClick={() => setPack(i)} data-testid={`cashew-pack-${i}`}
                        className={`px-3 py-4 border text-center transition-colors ${i === pack ? "border-terracotta bg-terracotta text-ivory" : "border-ink/20 text-ink hover:border-terracotta"}`}>
                  <span className="block font-serif text-2xl leading-none">₹{ps.price}</span>
                  <span className="block font-sans text-sm mt-1">{ps.label}</span>
                  <span className="block font-sans text-[11px] opacity-80 mt-0.5">{ps.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6 flex items-center gap-4">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft">Quantity</p>
            <div className="inline-flex items-center border border-ink/20">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} data-testid="cashew-qty-minus" className="h-11 w-11 flex items-center justify-center hover:bg-ivory-warm"><Minus size={16} /></button>
              <span data-testid="cashew-qty" className="w-12 text-center font-sans">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} data-testid="cashew-qty-plus" className="h-11 w-11 flex items-center justify-center hover:bg-ivory-warm"><Plus size={16} /></button>
            </div>
          </div>

          {/* Order */}
          <a href={waLink(wa, msg)} target="_blank" rel="noreferrer" data-testid="cashew-order-wa"
             className="mt-7 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors px-8 py-4 font-sans text-xs uppercase tracking-[0.2em] rounded-full">
            <MessageCircle size={16} /> Order {selected?.label} · ₹{selected?.price} on WhatsApp
          </a>

          {/* Allergen */}
          {product.allergens && (
            <div className="mt-5 flex gap-3 border border-terracotta/40 bg-terracotta/5 p-4">
              <AlertTriangle size={18} className="text-terracotta shrink-0 mt-0.5" />
              <p className="font-sans text-sm text-ink-soft"><span className="uppercase tracking-[0.15em] text-terracotta-deep text-xs">Allergens — </span>{product.allergens}</p>
            </div>
          )}

          <Link to={`/product/${product.slug}`} data-testid="cashew-details-link" className="link-underline inline-flex items-center gap-2 mt-5 font-sans text-xs uppercase tracking-[0.2em] text-ink">
            Full product details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

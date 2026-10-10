import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import Availability from "@/components/Availability";
import { useConfig } from "@/context/ConfigContext";
import { waLink, orderMessage } from "@/lib/api";

function priceFrom(p) {
  const prices = (p.pack_sizes || []).map((s) => s.price).filter((x) => x != null);
  if (!prices.length) return null;
  return Math.min(...prices);
}

export default function ProductCard({ product, index = 0 }) {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const from = priceFrom(product);
  const img = product.images?.[0];
  const available = product.availability === "available";
  const firstPack = product.pack_sizes?.[0];
  const msg = orderMessage(product, firstPack?.label, firstPack?.price, available ? 1 : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-col"
    >
      <Link to={`/product/${product.slug}`} data-testid={`product-card-${product.slug}`} className="group block">
        <div className="relative overflow-hidden bg-ivory-warm aspect-[4/5]">
          {img ? (
            <img src={img} alt={product.name} loading="lazy"
                 className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
          ) : (
            <div className="h-full w-full flex items-center justify-center font-serif text-6xl text-terracotta/30">AMYA</div>
          )}
          <div className="absolute top-3 left-3">
            <Availability status={product.availability} />
          </div>
          <div className="absolute bottom-0 right-0 h-11 w-11 bg-terracotta text-ivory flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <ArrowUpRight size={18} />
          </div>
        </div>
        <div className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-2xl text-ink leading-tight">{product.name}</h3>
            <span className="font-sans text-sm text-terracotta-deep whitespace-nowrap mt-1">
              {from != null ? `₹${from}+` : ""}
            </span>
          </div>
          {product.pack_sizes?.length > 0 && (
            <p className="font-sans text-xs text-ink-soft mt-1">
              {product.pack_sizes.map((s) => s.label).join(" · ")}
            </p>
          )}
        </div>
      </Link>
      <a
        href={waLink(wa, msg)} target="_blank" rel="noreferrer"
        data-testid={`order-wa-${product.slug}`}
        className="mt-3 inline-flex items-center justify-center gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-3 font-sans text-xs uppercase tracking-[0.18em] rounded-full"
      >
        <MessageCircle size={15} /> {available ? "Order on WhatsApp" : "Enquire on WhatsApp"}
      </a>
    </motion.div>
  );
}

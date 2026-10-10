import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Availability from "@/components/Availability";

function priceFrom(p) {
  const prices = (p.pack_sizes || []).map((s) => s.price).filter((x) => x != null);
  if (!prices.length) return null;
  return Math.min(...prices);
}

export default function ProductCard({ product, index = 0 }) {
  const from = priceFrom(product);
  const img = product.images?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link to={`/product/${product.slug}`} data-testid={`product-card-${product.slug}`} className="group block">
        <div className="relative overflow-hidden bg-ivory-warm aspect-[4/5]">
          {img ? (
            <img src={img} alt={product.name}
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
          <h3 className="font-serif text-2xl text-ink leading-tight">{product.name}</h3>
          <p className="font-sans text-sm text-ink-soft mt-1 line-clamp-2">{product.short_description}</p>
          <p className="font-sans text-xs uppercase tracking-[0.15em] text-terracotta mt-3">
            {from != null ? `From ₹${from}` : "Pricing confirmed at launch"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

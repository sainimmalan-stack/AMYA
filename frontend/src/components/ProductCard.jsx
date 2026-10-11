import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import Availability from "@/components/Availability";
import PicklePackMock from "@/components/PicklePackMock";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const img = product.images?.[0];
  const comingSoon = product.availability === "coming-soon";
  const orderable = ["ready", "order", "available"].includes(product.availability);
  const firstPack = product.pack_sizes?.[0];
  const prices = (product.pack_sizes || []).map((s) => s.price).filter((p) => p != null);
  const fromPrice = prices.length ? Math.min(...prices) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-col h-full"
    >
      <Link to={`/product/${product.slug}`} data-testid={`product-card-${product.slug}`} className="group block">
        <div className="relative overflow-hidden bg-ivory-warm rounded-xl aspect-[4/5]">
          {img ? (
            (product.category === "spices" || product.category === "oils") ? (
              <img src={img} alt={product.name} loading="lazy"
                   className="h-full w-full object-contain object-center p-2.5 sm:p-3" />
            ) : (
              <img src={img} alt={product.name} loading="lazy"
                   className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
            )
          ) : product.category === "pickles" ? (
            <PicklePackMock name={product.name} />
          ) : (
            <div className="h-full w-full flex items-center justify-center font-serif text-6xl text-terracotta/30">AMYA</div>
          )}
          {product.availability === "coming-soon" && (
            <div className="absolute top-2.5 left-2.5">
              <Availability status={product.availability} />
            </div>
          )}
          <div className="absolute bottom-0 right-0 h-10 w-10 bg-terracotta text-ivory flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <ArrowUpRight size={17} />
          </div>
        </div>
        <div className="pt-3 pb-3">
          <h3 className="font-serif text-base sm:text-xl lg:text-2xl text-ink leading-tight">{product.name}</h3>
          {product.pack_sizes?.length > 0 ? (
            <p className="font-sans text-[11px] sm:text-xs text-ink-soft mt-1.5 tracking-wide">
              {product.pack_sizes.map((s) => s.label).join(" · ")}
            </p>
          ) : (
            product.short_description && (
              <p className="font-sans text-[11px] sm:text-xs text-ink-soft mt-1.5 line-clamp-2">{product.short_description}</p>
            )
          )}
          {fromPrice != null && (
            <p className="font-sans text-[11px] sm:text-xs text-terracotta-deep font-medium mt-1" data-testid={`from-price-${product.slug}`}>
              From ₹{fromPrice.toLocaleString("en-IN")}
            </p>
          )}
          {product.availability === "order" && (
            <p className="font-sans text-[10px] sm:text-[11px] text-ink-soft/90 mt-1.5 leading-snug">Freshly prepared to order · Dispatch on Day 3</p>
          )}
        </div>
      </Link>
      {comingSoon ? (
        <span
          data-testid={`coming-soon-cta-${product.slug}`}
          className="mt-auto inline-flex items-center justify-center gap-1.5 border border-terracotta/40 text-terracotta-deep py-2 sm:py-2.5 px-2 font-sans text-[9px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.12em] leading-tight text-center rounded-full"
        >
          Coming soon
        </span>
      ) : (
        <button
          type="button"
          onClick={() => addItem(product, firstPack, 1)}
          data-testid={`add-cart-${product.slug}`}
          className="mt-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-terracotta text-ivory hover:bg-terracotta-deep transition-colors py-2 sm:py-2.5 px-2 font-sans text-[9px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.12em] leading-tight text-center rounded-full"
        >
          <ShoppingBag size={13} className="shrink-0" /> <span>Add to cart</span>
        </button>
      )}
    </motion.div>
  );
}

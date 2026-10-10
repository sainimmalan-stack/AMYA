import { MaskedLines } from "@/components/Reveal";
import { motion } from "framer-motion";

export default function PageHero({ eyebrow, titleLines, subtitle }) {
  return (
    <section className="bg-terracotta text-ivory grain relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-28 relative z-10">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
            className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/70 block mb-5">
            {eyebrow}
          </motion.span>
        )}
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[0.95] max-w-4xl">
          <MaskedLines lines={titleLines} delay={0.1} />
        </h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
            className="font-sans text-base sm:text-lg text-ivory/85 max-w-2xl mt-7 leading-relaxed">
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}

import { Video, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useConfig } from "@/context/ConfigContext";
import { waLink } from "@/lib/api";

const MSG = "Hi AMYA, I would like to know more about your oils and request a video call.";

export default function OilCallout() {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";

  return (
    <section className="bg-ink text-ivory" data-testid="oils-callout-section">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="border-l-2 border-terracotta pl-6 sm:pl-8"
        >
          <span className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-terracotta/15 text-terracotta-soft mb-5">
            <Video size={20} />
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.02]">
            See the craft. Trust the quality.
          </h2>
          <p className="font-sans text-base sm:text-lg text-ivory/80 mt-4 max-w-2xl leading-relaxed">
            Want to see how AMYA Oils are prepared? Connect with us on a video call and experience our process firsthand.
          </p>
          <a
            href={waLink(wa, MSG)} target="_blank" rel="noreferrer"
            data-testid="video-call-enquiry"
            className="inline-flex items-center gap-2 mt-7 bg-ivory text-terracotta hover:bg-ivory-warm transition-colors px-8 py-4 font-sans text-xs uppercase tracking-[0.2em] rounded-full"
          >
            Video call enquiries <ArrowRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

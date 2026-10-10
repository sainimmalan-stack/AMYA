import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Btn from "@/components/Btn";
import { Reveal } from "@/components/Reveal";
import { useConfig } from "@/context/ConfigContext";

const THUMB = "https://static.prod-images.emergentagent.com/jobs/c0402d02-f82c-4c87-9632-5729cd09b0fd/images/355a2d711b475e647f4a4a0607d9de6b7442e80cae73e64ea1c5e36c61d914cf.jpeg";

export default function OilVideo({ onDiscover }) {
  const { config } = useConfig();
  const videoUrl = config?.settings?.oils_video_url;
  const [playing, setPlaying] = useState(false);

  return (
    <section className="bg-ink text-ivory" data-testid="oils-video-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-24">
        <Reveal>
          <div className="max-w-2xl">
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta-soft">AMYA Oils</span>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.0]">
              Pure ingredients. Honest craft.
            </h2>
            <p className="font-sans text-base sm:text-lg text-ivory/80 mt-5 leading-relaxed">
              Discover AMYA Oils — thoughtfully prepared for your everyday cooking.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-9 relative rounded-2xl overflow-hidden aspect-video bg-ink-soft/40 max-h-[560px]">
            {playing && videoUrl ? (
              <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay playsInline data-testid="oils-video-player" />
            ) : (
              <button
                type="button"
                onClick={() => { if (videoUrl) setPlaying(true); }}
                data-testid="oils-video-play"
                className="group absolute inset-0 w-full h-full"
                aria-label="Play AMYA Oils video"
              >
                <img src={THUMB} alt="AMYA Oils" className="w-full h-full object-cover opacity-75 transition-opacity group-hover:opacity-90" />
                <span className="absolute inset-0 bg-ink/30" />
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <motion.span
                    whileHover={{ scale: 1.08 }}
                    className="h-20 w-20 rounded-full bg-terracotta text-ivory flex items-center justify-center shadow-xl"
                  >
                    <Play size={30} className="ml-1" fill="currentColor" />
                  </motion.span>
                  {!videoUrl && (
                    <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ivory/80">Video coming soon</span>
                  )}
                </span>
              </button>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-8">
            <Btn as="button" type="button" onClick={onDiscover} variant="solidIvory" data-testid="discover-oils-btn">
              Discover AMYA Oils
            </Btn>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

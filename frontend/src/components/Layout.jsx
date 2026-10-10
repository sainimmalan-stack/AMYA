import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageCircle } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { waLink } from "@/lib/api";

export default function Layout({ children }) {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const location = useLocation();
  const [hideFab, setHideFab] = useState(false);

  // Hide the floating button whenever it would overlap an on-page WhatsApp CTA
  useEffect(() => {
    const check = () => {
      const fab = {
        left: window.innerWidth - 88,
        top: window.innerHeight - 88,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };
      const els = document.querySelectorAll("[data-wa-cta]");
      let overlap = false;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.left < fab.right && r.right > fab.left && r.top < fab.bottom && r.bottom > fab.top) overlap = true;
      });
      setHideFab(overlap);
    };
    setHideFab(false);
    const t = setTimeout(check, 400);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [location.pathname]);

  return (
    <div className="App">
      <Header />
      <main>{children}</main>
      <Footer />
      <a
        href={waLink(wa, "Hello AMYA, I'd like to enquire about your products.")}
        target="_blank"
        rel="noreferrer"
        data-testid="floating-whatsapp"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        className={`fixed right-4 sm:right-5 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-terracotta text-ivory shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 ${
          hideFab ? "opacity-0 translate-y-3 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={22} />
      </a>
    </div>
  );
}

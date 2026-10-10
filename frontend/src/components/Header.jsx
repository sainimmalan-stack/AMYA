import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { useConfig } from "@/context/ConfigContext";
import { waLink, telHref } from "@/lib/api";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop/cashew-brittles", label: "Cashew Brittle" },
  { to: "/shop/oils", label: "AMYA Oils" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { config } = useConfig();
  const phone = config?.business?.phone || "9675334567";
  const wa = config?.business?.whatsapp || "919675334567";

  return (
    <>
      <header className="sticky top-0 z-40 bg-terracotta border-b border-ivory/15">
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center">
          {/* Mobile / tablet: centred logo */}
          <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Logo variant="ivory" size="header" />
          </div>
          {/* Desktop: left-aligned logo */}
          <div className="hidden lg:block">
            <Logo variant="ivory" size="header" />
          </div>

          <nav className="hidden lg:flex items-center gap-7 ml-10">
            {NAV.slice(1).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
                className={`link-underline font-sans text-xs uppercase tracking-[0.18em] transition-colors ${
                  loc.pathname === n.to ? "text-ivory" : "text-ivory/70 hover:text-ivory"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <a href={telHref(phone)} data-testid="header-call-btn"
               className="hidden sm:inline-flex h-10 w-10 items-center justify-center border border-ivory/30 text-ivory hover:bg-ivory hover:text-terracotta hover:border-ivory transition-colors rounded-full">
              <Phone size={15} />
            </a>
            <a href={waLink(wa, "Hello AMYA, I'd like to know more.")} target="_blank" rel="noreferrer"
               data-testid="header-whatsapp-btn"
               className="hidden sm:inline-flex h-10 w-10 items-center justify-center border border-ivory/30 text-ivory hover:bg-ivory hover:text-terracotta hover:border-ivory transition-colors rounded-full">
              <MessageCircle size={15} />
            </a>
            <button
              onClick={() => setOpen(true)}
              data-testid="mobile-menu-open"
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center text-ivory"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-terracotta text-ivory grain"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            data-testid="mobile-menu"
          >
            <div className="flex items-center justify-between h-20 px-5">
              <Logo variant="ivory" size="menu" />
              <button onClick={() => setOpen(false)} data-testid="mobile-menu-close" aria-label="Close menu"
                      className="h-10 w-10 inline-flex items-center justify-center">
                <X size={24} />
              </button>
            </div>
            <nav className="px-6 mt-6 flex flex-col gap-1">
              {NAV.map((n, i) => (
                <motion.div key={n.to}
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.4 }}>
                  <Link to={n.to} onClick={() => setOpen(false)}
                        data-testid={`mobile-nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
                        className="block font-serif text-4xl py-2 border-b border-ivory/15">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="px-6 mt-8 flex gap-3">
              <a href={telHref(phone)} className="flex-1 border border-ivory/40 py-3 text-center text-xs uppercase tracking-[0.2em]">Call</a>
              <a href={waLink(wa, "Hello AMYA")} target="_blank" rel="noreferrer" className="flex-1 bg-ivory text-terracotta py-3 text-center text-xs uppercase tracking-[0.2em]">WhatsApp</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

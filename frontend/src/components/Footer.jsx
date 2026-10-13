import { Link } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { useConfig } from "@/context/ConfigContext";
import { waLink, telHref, formatPhoneIN } from "@/lib/api";

export default function Footer() {
  const { config } = useConfig();
  const phone = config?.business?.phone || "9675334567";
  const wa = config?.business?.whatsapp || "919675334567";

  return (
    <footer className="bg-terracotta text-ivory relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 relative z-10">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Logo variant="ivory" size="md" className="!items-start" />
            <p className="mt-6 max-w-sm font-sans text-sm text-ivory/80 leading-relaxed">
              A founder-led artisanal food brand by Amulya Nimmala. Good food begins with trust —
              we start small and build our customer experience step by step.
            </p>
          </div>
          <div>
            <h4 className="font-sans text-[11px] uppercase tracking-[0.22em] text-ivory/60 mb-5">Explore</h4>
            <ul className="space-y-3 font-sans text-sm">
              {[["Shop", "/shop"], ["Our Story", "/our-story"], ["Prepared with Care", "/#prepared-with-care"], ["AMYA Live Press", "/live-press"], ["Transparency", "/transparency"], ["Refund & Replacement", "/refund-policy"], ["About", "/about"]].map(([l, t]) => (
                <li key={t}><Link to={t} data-testid={`footer-link-${l.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "")}`} className="link-underline text-ivory/85 hover:text-ivory">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-[11px] uppercase tracking-[0.22em] text-ivory/60 mb-5">Reach us</h4>
            <ul className="space-y-3 font-sans text-sm">
              <li className="text-ivory/85">Amulya Nimmala</li>
              <li>
                <a href={telHref(phone)} data-testid="footer-call" className="inline-flex items-center gap-2 text-ivory/85 hover:text-ivory">
                  <Phone size={14} /> {formatPhoneIN(phone)}
                </a>
              </li>
              <li>
                <a href={waLink(wa, "Hello AMYA")} target="_blank" rel="noreferrer" data-testid="footer-whatsapp" className="inline-flex items-center gap-2 text-ivory/85 hover:text-ivory">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-ivory/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[11px] text-ivory/60">© {new Date().getFullYear()} AMYA Artisanal Foods · amyafoods.in</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-[11px] text-ivory/70">
            <Link to="/policies/terms" className="hover:text-ivory">Terms</Link>
            <Link to="/policies/privacy" className="hover:text-ivory">Privacy</Link>
            <Link to="/policies/shipping" className="hover:text-ivory">Shipping</Link>
            <Link to="/policies/refund" className="hover:text-ivory">Cancellation & Refund</Link>
            <Link to="/admin/login" className="hover:text-ivory">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

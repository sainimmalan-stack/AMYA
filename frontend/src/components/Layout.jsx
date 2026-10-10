import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageCircle } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { waLink } from "@/lib/api";

export default function Layout({ children }) {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  return (
    <div className="App">
      <Header />
      <main>{children}</main>
      <Footer />
      <a
        href={waLink(wa, "Hello AMYA, I'd like to enquire about your products.")}
        target="_blank" rel="noreferrer"
        data-testid="floating-whatsapp"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-terracotta text-ivory shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={24} />
      </a>
    </div>
  );
}

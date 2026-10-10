import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api, waLink, formatApiError } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import Btn from "@/components/Btn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TIME_SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "4:30 PM"];

export default function HomeBooking() {
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const [oils, setOils] = useState([]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", product_slug: "", preferred_date: "", preferred_time: "", instructions: "" });

  useEffect(() => {
    api.get("/products?category=oils").then(({ data }) => setOils(data.filter((p) => p.live_press)));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const selectedOil = oils.find((o) => o.slug === form.product_slug);

  const buildMsg = () =>
    `*AMYA — Live Oil Session Request*\n` +
    `Name: ${form.name}\n` +
    `WhatsApp: ${form.whatsapp}\n` +
    `Preferred oil: ${selectedOil ? selectedOil.name : form.product_slug}\n` +
    `Preferred date: ${form.preferred_date}\n` +
    `Preferred time: ${form.preferred_time}\n` +
    (form.instructions ? `Questions / requests: ${form.instructions}\n` : "") +
    `\n(This is a request — please confirm an available slot.)`;

  const submit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.name || !form.whatsapp || !form.product_slug || !form.preferred_date || !form.preferred_time) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        name: form.name,
        mobile: form.whatsapp,
        whatsapp: form.whatsapp,
        product_slug: form.product_slug,
        product_name: selectedOil ? selectedOil.name : form.product_slug,
        quantity: "To be discussed",
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        instructions: form.instructions,
      });
      setDone(true);
      window.open(waLink(wa, buildMsg()), "_blank");
      toast.success("Request sent. We'll confirm your slot.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div data-testid="home-booking-success" className="bg-ivory text-ink border border-terracotta/30 p-8 sm:p-10 text-center">
        <CheckCircle2 size={40} className="text-terracotta mx-auto" />
        <h3 className="font-serif text-3xl mt-4">Request received</h3>
        <p className="font-sans text-sm text-ink-soft mt-3 max-w-md mx-auto">
          Thank you. Your live-session request has been logged and a prefilled WhatsApp message opened. Your slot is
          <strong> not confirmed</strong> until AMYA replies to confirm a time.
        </p>
        <Btn as="a" href={waLink(wa, buildMsg())} target="_blank" rel="noreferrer" variant="solid" className="mt-6">
          <MessageCircle size={15} /> Re-open WhatsApp
        </Btn>
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={submit} data-testid="home-booking-form"
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="bg-ivory text-ink p-6 sm:p-8 grid sm:grid-cols-2 gap-5"
    >
      <F label="Your name *"><Input data-testid="hb-name" value={form.name} onChange={set("name")} className="bg-ivory" /></F>
      <F label="WhatsApp number *"><Input data-testid="hb-whatsapp" value={form.whatsapp} onChange={set("whatsapp")} className="bg-ivory" placeholder="+91…" /></F>
      <F label="Preferred oil *">
        <select data-testid="hb-oil" value={form.product_slug} onChange={set("product_slug")} className="w-full h-10 px-3 border border-input bg-ivory text-sm">
          <option value="">Choose an oil…</option>
          {oils.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
        </select>
      </F>
      <F label="Preferred date *"><Input data-testid="hb-date" type="date" value={form.preferred_date} onChange={set("preferred_date")} className="bg-ivory" /></F>
      <F label="Preferred time *">
        <select data-testid="hb-time" value={form.preferred_time} onChange={set("preferred_time")} className="w-full h-10 px-3 border border-input bg-ivory text-sm">
          <option value="">Choose a time…</option>
          {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </F>
      <div className="sm:col-span-2">
        <F label="Questions or special requests"><Textarea data-testid="hb-notes" rows={3} value={form.instructions} onChange={set("instructions")} className="bg-ivory" /></F>
      </div>
      <div className="sm:col-span-2 flex flex-col sm:flex-row items-center gap-4">
        <Btn as="button" type="button" onClick={submit} variant="solid" disabled={submitting} data-testid="hb-submit">
          {submitting ? "Sending…" : "Request my live session"} <ArrowRight size={15} />
        </Btn>
        <p className="font-sans text-xs text-ink-soft">Sent to AMYA on WhatsApp for confirmation. Not confirmed until AMYA replies.</p>
      </div>
    </motion.form>
  );
}

const F = ({ label, children }) => (
  <div>
    <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">{label}</Label>
    {children}
  </div>
);

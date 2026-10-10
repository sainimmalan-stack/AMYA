import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Video, Eye, Package, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api, waLink, formatApiError } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import Btn from "@/components/Btn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const STEPS = [
  { icon: Leaf, t: "Choose your oil", d: "Customers select an available cooking oil and quantity." },
  { icon: Video, t: "Book your slot", d: "Customers select an available date and time for preparation." },
  { icon: Eye, t: "Watch it live", d: "Join a WhatsApp video call to observe the actual preparation process, subject to production availability." },
  { icon: Package, t: "Receive your order", d: "After preparation, the oil is packed and dispatched per the confirmed order." },
];

const TIME_SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "4:30 PM"];

export default function LivePress() {
  const [params] = useSearchParams();
  const { config } = useConfig();
  const wa = config?.business?.whatsapp || "919675334567";
  const [oils, setOils] = useState([]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", mobile: "", whatsapp: "", product_slug: "", quantity: "",
    preferred_date: "", preferred_time: "", postcode: "", instructions: "", wants_recording: false,
  });

  useEffect(() => {
    api.get("/products?category=oils").then(({ data }) => {
      const list = data.filter((p) => p.live_press);
      setOils(list);
      const pre = params.get("oil");
      if (pre && list.find((p) => p.slug === pre)) setForm((f) => ({ ...f, product_slug: pre }));
    });
  }, [params]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectedOil = oils.find((o) => o.slug === form.product_slug);

  const buildMsg = () =>
    `*AMYA Live Press — Booking Request*\n` +
    `Name: ${form.name}\n` +
    `Mobile: ${form.mobile}\n` +
    (form.whatsapp ? `WhatsApp: ${form.whatsapp}\n` : "") +
    `Oil: ${selectedOil ? selectedOil.name : form.product_slug}\n` +
    `Quantity: ${form.quantity}\n` +
    `Preferred date: ${form.preferred_date}\n` +
    `Preferred time: ${form.preferred_time}\n` +
    (form.postcode ? `Delivery postcode: ${form.postcode}\n` : "") +
    (form.wants_recording ? `Also requests a batch recording if unable to attend live.\n` : "") +
    (form.instructions ? `Notes: ${form.instructions}\n` : "") +
    `\n(This is a request — please confirm an available slot.)`;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.product_slug || !form.quantity || !form.preferred_date || !form.preferred_time) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        ...form,
        product_name: selectedOil ? selectedOil.name : form.product_slug,
      });
      setDone(true);
      window.open(waLink(wa, buildMsg()), "_blank");
      toast.success("Booking request sent. We'll confirm your slot.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="live-press-page">
      <PageHero
        eyebrow="AMYA Live Press · cooking oils only"
        titleLines={["Don't just buy your oil.", "See how it's made."]}
        subtitle="Choose your oil, book an available preparation slot and connect with us to watch the oil extraction process live."
      />

      {/* Steps */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="border-t border-ink/15 pt-6">
                <div className="flex items-center justify-between">
                  <s.icon size={24} className="text-terracotta" />
                  <span className="font-serif text-3xl text-terracotta/40">{`0${i + 1}`}</span>
                </div>
                <h3 className="font-serif text-2xl mt-4">{s.t}</h3>
                <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Booking form */}
      <section className="bg-ivory-warm">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
          <Reveal>
            <div className="text-center mb-12">
              <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Request a slot</span>
              <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-4">Book your live press</h2>
              <p className="font-sans text-sm text-ink-soft mt-4 max-w-2xl mx-auto">
                We display only genuinely available slots as a request. A booking is <strong>not confirmed</strong> until
                AMYA confirms it. Can't attend live? Ask for a recording of the relevant batch, subject to availability.
              </p>
            </div>
          </Reveal>

          {done ? (
            <Reveal>
              <div data-testid="booking-success" className="bg-ivory border border-terracotta/30 p-10 text-center">
                <CheckCircle2 size={44} className="text-terracotta mx-auto" />
                <h3 className="font-serif text-3xl mt-5">Request received</h3>
                <p className="font-sans text-sm text-ink-soft mt-3 max-w-md mx-auto">
                  Thank you. Your booking request has been logged and a prefilled WhatsApp message opened. AMYA will
                  contact you to confirm an available slot. Nothing is confirmed until we reply.
                </p>
                <Btn as="a" href={waLink(wa, buildMsg())} target="_blank" rel="noreferrer" variant="solid" className="mt-7">
                  <MessageCircle size={15} /> Re-open WhatsApp
                </Btn>
              </div>
            </Reveal>
          ) : (
            <motion.form onSubmit={submit} data-testid="booking-form"
                         initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                         className="bg-ivory border border-ink/10 p-6 sm:p-10 grid sm:grid-cols-2 gap-6">
              <Field label="Your name *"><Input data-testid="bk-name" value={form.name} onChange={set("name")} className="bg-ivory" /></Field>
              <Field label="Mobile number *"><Input data-testid="bk-mobile" value={form.mobile} onChange={set("mobile")} className="bg-ivory" /></Field>
              <Field label="WhatsApp number (if different)"><Input data-testid="bk-whatsapp" value={form.whatsapp} onChange={set("whatsapp")} className="bg-ivory" /></Field>
              <Field label="Select oil *">
                <select data-testid="bk-oil" value={form.product_slug} onChange={set("product_slug")}
                        className="w-full h-10 px-3 border border-input bg-ivory font-sans text-sm">
                  <option value="">Choose an oil…</option>
                  {oils.map((o) => (
                    <option key={o.slug} value={o.slug} disabled={o.availability === "unavailable"}>
                      {o.name}{o.availability !== "available" ? ` (${o.availability.replace("-", " ")})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity *"><Input data-testid="bk-qty" placeholder="e.g. 1 L" value={form.quantity} onChange={set("quantity")} className="bg-ivory" /></Field>
              <Field label="Delivery postcode"><Input data-testid="bk-postcode" value={form.postcode} onChange={set("postcode")} className="bg-ivory" /></Field>
              <Field label="Preferred date *"><Input data-testid="bk-date" type="date" value={form.preferred_date} onChange={set("preferred_date")} className="bg-ivory" /></Field>
              <Field label="Preferred time *">
                <select data-testid="bk-time" value={form.preferred_time} onChange={set("preferred_time")}
                        className="w-full h-10 px-3 border border-input bg-ivory font-sans text-sm">
                  <option value="">Choose a slot…</option>
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Additional instructions"><Textarea data-testid="bk-notes" value={form.instructions} onChange={set("instructions")} className="bg-ivory" rows={3} /></Field>
              </div>
              <label className="sm:col-span-2 flex items-start gap-3 cursor-pointer">
                <Checkbox data-testid="bk-recording" checked={form.wants_recording}
                          onCheckedChange={(v) => setForm((f) => ({ ...f, wants_recording: !!v }))} className="mt-0.5" />
                <span className="font-sans text-sm text-ink-soft">
                  I may not be able to attend live — please send a recording of my batch if available.
                </span>
              </label>
              <div className="sm:col-span-2 flex flex-col sm:flex-row items-center gap-4 mt-2">
                <Btn as="button" type="submit" variant="solid" disabled={submitting} data-testid="bk-submit">
                  {submitting ? "Sending…" : "Send booking request"} <ArrowRight size={15} />
                </Btn>
                <p className="font-sans text-xs text-ink-soft">Sent to AMYA on WhatsApp (+91 96753 34567) for confirmation.</p>
              </div>
            </motion.form>
          )}
        </div>
      </section>

      {/* Honest note */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
        <Reveal>
          <div className="border-l-2 border-terracotta pl-6">
            <h3 className="font-serif text-2xl">A live call is part of transparency — not the whole of quality.</h3>
            <p className="font-sans text-sm text-ink-soft mt-3 leading-relaxed">
              Watching your oil being pressed shows you the process honestly. It does not, on its own, prove purity.
              Transparency, proper handling, traceability and appropriate product testing are separate parts of
              quality assurance, and we build each of them step by step.
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">{label}</Label>
    {children}
  </div>
);

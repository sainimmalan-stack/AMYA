import { useState } from "react";
import { Phone, MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import Btn from "@/components/Btn";
import { api, waLink, formatApiError } from "@/lib/api";
import { useConfig } from "@/context/ConfigContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const COUNTRIES = ["India", "United Kingdom", "United States", "Other"];

export default function Contact() {
  const { config } = useConfig();
  const phone = config?.business?.phone || "9675334567";
  const wa = config?.business?.whatsapp || "919675334567";
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: "general", name: "", email: "", phone: "", country: "India", postcode: "", message: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || (!form.phone && !form.email) || !form.message) {
      toast.error("Please add your name, a way to reach you, and a message.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/enquiries", form);
      setDone(true);
      toast.success("Thank you. We'll be in touch soon.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSubmitting(false); }
  };

  return (
    <div data-testid="contact-page">
      <PageHero
        eyebrow="Contact"
        titleLines={["Let's talk."]}
        subtitle="Questions about a product, a live press booking, or shipping to India, the UK or USA? Reach Amulya directly."
      />

      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24 grid lg:grid-cols-5 gap-14">
        <div className="lg:col-span-2">
          <Reveal>
            <h2 className="font-serif text-3xl">Amulya Nimmala</h2>
            <p className="font-sans text-sm text-ink-soft mt-2">Founder, AMYA Artisanal Foods</p>
            <div className="flex flex-col gap-3 mt-7">
              <Btn as="a" href={`tel:${phone}`} variant="solid" data-testid="contact-call"><Phone size={15} /> Call {phone}</Btn>
              <Btn as="a" href={waLink(wa, "Hello AMYA, I have a question.")} target="_blank" rel="noreferrer" variant="outline" data-testid="contact-whatsapp"><MessageCircle size={15} /> Chat on WhatsApp</Btn>
            </div>
            <div className="mt-10 border-t border-ink/15 pt-6">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft">Email</p>
              <p className="font-sans text-sm text-ink-soft mt-1">A business email will be published here once configured.</p>
            </div>
            <div className="mt-6 border-t border-ink/15 pt-6">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft">International shipping</p>
              <p className="font-sans text-sm text-ink-soft mt-1">
                International shipping is quoted individually. Contact AMYA for availability and a delivery estimate.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-3">
          {done ? (
            <Reveal>
              <div data-testid="contact-success" className="bg-ivory-warm border border-terracotta/30 p-10 text-center">
                <CheckCircle2 size={44} className="text-terracotta mx-auto" />
                <h3 className="font-serif text-3xl mt-5">Message sent</h3>
                <p className="font-sans text-sm text-ink-soft mt-3">Thank you for reaching out. We'll reply as soon as we can.</p>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <form onSubmit={submit} data-testid="contact-form" className="grid sm:grid-cols-2 gap-6">
                <Field label="Enquiry type">
                  <select data-testid="ct-type" value={form.type} onChange={set("type")} className="w-full h-10 px-3 border border-input bg-ivory font-sans text-sm">
                    <option value="general">General</option>
                    <option value="order">Product / order</option>
                    <option value="shipping">Shipping enquiry</option>
                  </select>
                </Field>
                <Field label="Country">
                  <select data-testid="ct-country" value={form.country} onChange={set("country")} className="w-full h-10 px-3 border border-input bg-ivory font-sans text-sm">
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Your name *"><Input data-testid="ct-name" value={form.name} onChange={set("name")} /></Field>
                <Field label="Phone"><Input data-testid="ct-phone" value={form.phone} onChange={set("phone")} /></Field>
                <Field label="Email"><Input data-testid="ct-email" type="email" value={form.email} onChange={set("email")} /></Field>
                <Field label="Postcode (for shipping)"><Input data-testid="ct-postcode" value={form.postcode} onChange={set("postcode")} /></Field>
                <div className="sm:col-span-2">
                  <Field label="Message *"><Textarea data-testid="ct-message" rows={5} value={form.message} onChange={set("message")} /></Field>
                </div>
                <div className="sm:col-span-2">
                  <Btn as="button" type="submit" variant="solid" disabled={submitting} data-testid="ct-submit">
                    {submitting ? "Sending…" : "Send message"} <ArrowRight size={15} />
                  </Btn>
                </div>
              </form>
            </Reveal>
          )}
        </div>
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

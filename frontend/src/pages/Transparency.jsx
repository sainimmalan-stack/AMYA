import { useEffect, useState } from "react";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { api } from "@/lib/api";
import { FileText, Boxes, Droplets, ShieldCheck, Megaphone, Truck } from "lucide-react";

const COMMITMENTS = [
  [Droplets, "Clear ingredient information", "We state ingredients plainly for each product."],
  [Boxes, "Traceable production batches", "A future-ready batch record for each prepared batch."],
  [FileText, "Honest extraction methods", "Straightforward descriptions of how each oil is pressed."],
  [ShieldCheck, "Proper handling & packaging", "Hygienic handling and careful packaging as we scale."],
  [Megaphone, "Clear availability communication", "We show what's available, coming soon or unavailable."],
  [Truck, "Accurate delivery information", "Delivery details shared honestly, confirmed before dispatch."],
];

export default function Transparency() {
  const [batches, setBatches] = useState([]);
  useEffect(() => { api.get("/batches").then(({ data }) => setBatches(data)); }, []);

  return (
    <div data-testid="transparency-page">
      <PageHero
        eyebrow="Our transparency promise"
        titleLines={["Trust isn't a claim.", "It's a process."]}
        subtitle="Here are the commitments we are building — presented honestly, as what we are putting in place rather than claims already completed."
      />

      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COMMITMENTS.map(([Icon, t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 0.08}>
              <div className="border border-ink/10 p-7 h-full">
                <Icon size={22} className="text-terracotta" />
                <h3 className="font-serif text-2xl mt-4">{t}</h3>
                <p className="font-sans text-sm text-ink-soft mt-2 leading-relaxed">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Batch records */}
      <section className="bg-ivory-warm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">Batch information</span>
            <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-4">Traceable batches</h2>
            <p className="font-sans text-sm text-ink-soft mt-4 max-w-2xl">
              Each batch record is created or approved by AMYA. Records appear here as batches are prepared.
            </p>
          </Reveal>
          <div className="mt-10">
            {batches.length === 0 ? (
              <Reveal><p className="font-serif text-2xl text-ink/50">No batch records published yet.</p></Reveal>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {batches.map((b) => (
                  <div key={b.id} data-testid={`batch-${b.batch_id}`} className="bg-ivory border border-ink/10 p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs uppercase tracking-[0.2em] text-terracotta">{b.batch_id}</span>
                      <span className="font-sans text-xs text-ink-soft">{b.production_date}</span>
                    </div>
                    <h3 className="font-serif text-2xl mt-2">{b.product_name}</h3>
                    {b.extraction_method && <p className="font-sans text-sm text-ink-soft mt-2">Method: {b.extraction_method}</p>}
                    {b.ingredient_source && <p className="font-sans text-sm text-ink-soft">Source: {b.ingredient_source}</p>}
                    {b.notes && <p className="font-sans text-sm text-ink-soft mt-2">{b.notes}</p>}
                    <div className="flex gap-4 mt-3">
                      {b.quality_report_url && <a href={b.quality_report_url} target="_blank" rel="noreferrer" className="link-underline font-sans text-xs uppercase tracking-[0.15em] text-terracotta">Quality report</a>}
                      {b.video_url && <a href={b.video_url} target="_blank" rel="noreferrer" className="link-underline font-sans text-xs uppercase tracking-[0.15em] text-terracotta">Preparation video</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

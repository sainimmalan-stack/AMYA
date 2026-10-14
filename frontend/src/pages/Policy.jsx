import { useParams } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { useConfig } from "@/context/ConfigContext";

const META = {
  terms: { key: "terms", title: ["Terms &", "Conditions."], eyebrow: "Policy" },
  privacy: { key: "privacy", title: ["Privacy", "Policy."], eyebrow: "Policy" },
  shipping: { key: "shipping", title: ["Shipping", "Policy."], eyebrow: "Policy" },
  refund: { key: "refund", title: ["Cancellation", "& Refund."], eyebrow: "Policy" },
  food: { key: "food_disclosure", title: ["Food-business", "disclosures."], eyebrow: "Policy" },
};

export default function Policy() {
  const { slug } = useParams();
  const { config } = useConfig();
  const meta = META[slug] || META.terms;
  const policies = config?.settings?.policies || {};
  const body = policies[meta.key] || "This policy will be published here.";

  return (
    <div data-testid={`policy-${slug}`}>
      <PageHero eyebrow={meta.eyebrow} titleLines={meta.title} />
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <Reveal>
          <p className="font-sans text-base text-ink-soft leading-relaxed whitespace-pre-line">{body}</p>
          <p className="font-sans text-xs text-ink-soft mt-10 border-t border-ink/15 pt-6">
            AMYA is a founder led, pre-launch brand. This content is editable by AMYA and will be finalised before
            commercial checkout is enabled. It does not constitute legal advice.
          </p>
        </Reveal>
      </section>
    </div>
  );
}

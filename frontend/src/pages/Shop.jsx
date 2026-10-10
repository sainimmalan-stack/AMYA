import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import PageHero from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";

const CATEGORY_META = {
  spices: {
    eyebrow: "AMYA Signature Spices",
    title: ["Signature Spices."],
    sub: "Carefully selected Guntur Sannam chillies and turmeric from Srikakulam, Andhra Pradesh, prepared in small batches with hygienic handling and authentic flavour.",
    key: "spices",
  },
  pickles: {
    eyebrow: "Traditional pickles, authentic flavours",
    title: ["Traditional Pickles."],
    sub: "Celebrating the bold, comforting flavours of Indian kitchens through traditional recipes, carefully selected ingredients and thoughtful preparation. Launching soon.",
    key: "pickles",
  },
  "cashew-brittles": {
    eyebrow: "Artisanal foods",
    title: ["Cashew Brittle."],
    sub: "Premium whole roasted cashews dipped in jaggery, crafted in small batches by AMYA.",
    key: "cashew-brittles",
  },
  oils: {
    eyebrow: "Cold-extracted, prepared to order",
    title: ["AMYA Oils."],
    sub: "Cooking oils cold-extracted in small batches using our own setup. Request a live session to watch the actual process and ask questions before you order.",
    key: "oils",
  },
};

export default function Shop() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const meta = category ? CATEGORY_META[category] : null;

  useEffect(() => {
    setLoading(true);
    const url = category ? `/products?category=${category}` : "/products";
    api.get(url).then(({ data }) => { setProducts(data); setLoading(false); });
  }, [category]);

  return (
    <div data-testid="shop-page">
      <PageHero
        eyebrow={meta ? meta.eyebrow : "A small, considered range"}
        titleLines={meta ? meta.title : ["The Shop."]}
        subtitle={meta ? meta.sub : "Browse the full AMYA collection — oils, cashew brittles and homemade pickles. We introduce products gradually, one at a time."}
      />
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 lg:py-20">
        {loading ? (
          <p className="font-sans text-ink-soft">Loading…</p>
        ) : products.length === 0 ? (
          <Reveal>
            <p className="font-serif text-3xl text-ink/60">No products in this category yet.</p>
          </Reveal>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}

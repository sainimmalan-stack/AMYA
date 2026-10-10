import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import PageHero from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";

const CATEGORY_META = {
  oils: {
    eyebrow: "Wood-pressed, prepared to order",
    title: ["AMYA Oils."],
    sub: "Cooking oils produced using our own traditional wooden chekku / ghani extraction setup. Every oil can be prepared live through AMYA Live Press.",
    key: "oils",
  },
  pickles: {
    eyebrow: "Homemade, small batch",
    title: ["AMYA Pickles."],
    sub: "Homemade pickles prepared the traditional way. AMYA plans to use its own cooking oils in pickle preparation once those oils become available.",
    key: "pickles",
  },
  "cashew-brittles": {
    eyebrow: "Crunchy, golden, homemade",
    title: ["Cashew Brittles."],
    sub: "A homemade cashew brittle made in small batches — crisp caramel with generous cashew pieces.",
    key: "cashew-brittles",
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
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
        {loading ? (
          <p className="font-sans text-ink-soft">Loading…</p>
        ) : products.length === 0 ? (
          <Reveal>
            <p className="font-serif text-3xl text-ink/60">No products in this category yet.</p>
          </Reveal>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}

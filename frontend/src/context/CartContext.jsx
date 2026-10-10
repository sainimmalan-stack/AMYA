import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);
const WA_NUMBER = "919675334567";
const STORAGE_KEY = "amya_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  // product: {slug, name}; pack: {label, price, note} | null; qty: number
  const addItem = useCallback((product, pack, qty = 1) => {
    const packLabel = pack?.label || null;
    const price = pack?.price ?? null;
    const note = pack?.note || null;
    const key = `${product.slug}__${packLabel || "default"}`;
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { key, slug: product.slug, name: product.name, packLabel, price, note, qty }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, qty: Math.max(1, qty) } : it)));
  }, []);
  const removeItem = useCallback((key) => setItems((prev) => prev.filter((it) => it.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, it) => n + it.qty, 0);
  const allPriced = items.length > 0 && items.every((it) => it.price != null);
  const grandTotal = allPriced ? items.reduce((s, it) => s + it.price * it.qty, 0) : null;

  const buildMessage = useCallback(() => {
    const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
    const lines = ["Hello AMYA! I would like to place an order.", "", "My Order:"];
    items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name}`);
      if (it.packLabel) lines.push(`   Pack size: ${it.packLabel}`);
      lines.push(`   Quantity: ${it.qty} pack${it.qty > 1 ? "s" : ""}`);
      if (it.price != null) {
        lines.push(`   Price: ${inr(it.price)} per pack`);
        lines.push(`   Subtotal: ${inr(it.price * it.qty)}`);
      } else {
        lines.push(`   Price: To be confirmed`);
      }
    });
    lines.push("");
    lines.push(grandTotal != null ? `Order total: ${inr(grandTotal)}` : "Order total: To be confirmed");
    lines.push("");
    lines.push("Please confirm product availability, delivery location, shipping charges if applicable, and the expected delivery or dispatch date.");
    lines.push("");
    lines.push("Thank you!");
    return lines.join("\n");
  }, [items, grandTotal]);

  const whatsappUrl = useCallback(
    () => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage())}`,
    [buildMessage],
  );

  return (
    <CartContext.Provider
      value={{ items, open, setOpen, addItem, setQty, removeItem, clear, count, allPriced, grandTotal, buildMessage, whatsappUrl }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

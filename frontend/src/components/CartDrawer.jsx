import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function CartDrawer() {
  const { items, open, setOpen, setQty, removeItem, clear, count, allPriced, grandTotal, whatsappUrl, orderRef, newOrderRef } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="bg-ivory text-ink w-full sm:max-w-md flex flex-col p-0 border-l border-ink/10" data-testid="cart-drawer">
        <SheetHeader className="px-5 py-4 border-b border-ink/10 text-left">
          <SheetTitle className="font-serif text-2xl text-ink">Your Cart ({count})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6" data-testid="cart-empty">
            <ShoppingBag className="text-terracotta/40" size={40} />
            <p className="font-sans text-sm text-ink-soft mt-4">Your cart is empty.</p>
            <p className="font-sans text-xs text-ink-soft mt-1">Add products to send your order on WhatsApp.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((it) => (
                <div key={it.key} className="flex gap-3 border-b border-ink/10 pb-4" data-testid={`cart-item-${it.slug}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base text-ink leading-tight">{it.name}</p>
                    {it.packLabel && <p className="font-sans text-xs text-ink-soft mt-0.5">Pack size: {it.packLabel}</p>}
                    <p className="font-sans text-xs text-ink-soft mt-0.5">
                      {it.price != null ? `${inr(it.price)} / pack` : "Price to be confirmed"}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="inline-flex items-center border border-ink/15 rounded-full">
                        <button onClick={() => setQty(it.key, it.qty - 1)} className="p-1.5 text-ink hover:text-terracotta" data-testid={`cart-dec-${it.slug}`} aria-label="Decrease"><Minus size={13} /></button>
                        <span className="px-2 font-sans text-sm min-w-[1.5rem] text-center" data-testid={`cart-qty-${it.slug}`}>{it.qty}</span>
                        <button onClick={() => setQty(it.key, it.qty + 1)} className="p-1.5 text-ink hover:text-terracotta" data-testid={`cart-inc-${it.slug}`} aria-label="Increase"><Plus size={13} /></button>
                      </div>
                      <button onClick={() => removeItem(it.key)} className="text-ink-soft hover:text-terracotta transition-colors" data-testid={`cart-remove-${it.slug}`} aria-label="Remove"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="text-right font-sans text-sm text-ink whitespace-nowrap" data-testid={`cart-line-total-${it.slug}`}>
                    {it.price != null ? inr(it.price * it.qty) : "—"}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink/10 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-ink-soft">Order reference</span>
                <span className="font-sans text-xs font-medium tracking-[0.1em] text-terracotta" data-testid="cart-order-ref">{orderRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm text-ink-soft">Order total</span>
                <span className="font-serif text-lg text-ink" data-testid="cart-grand-total">
                  {allPriced ? inr(grandTotal) : "To be confirmed"}
                </span>
              </div>
              {!allPriced && (
                <p className="font-sans text-[11px] text-ink-soft leading-relaxed">
                  Some items need pricing confirmation — the final total will be confirmed with you on WhatsApp.
                </p>
              )}
              <button
                onClick={() => { setOpen(false); navigate("/checkout"); }}
                className="w-full flex items-center justify-center gap-2 bg-terracotta text-ivory rounded-full py-3 font-sans text-xs uppercase tracking-[0.14em] hover:bg-terracotta-deep transition-colors"
                data-testid="cart-checkout"
              >
                <ShoppingBag size={15} /> Proceed to Checkout
              </button>
              <a
                href={whatsappUrl()} target="_blank" rel="noreferrer" onClick={() => { setOpen(false); newOrderRef(); }}
                className="flex items-center justify-center gap-2 border border-terracotta text-terracotta-deep rounded-full py-3 font-sans text-xs uppercase tracking-[0.14em] hover:bg-terracotta hover:text-ivory transition-colors"
                data-testid="cart-send-whatsapp"
              >
                <MessageCircle size={15} /> Order on WhatsApp instead
              </a>
              <button onClick={clear} className="w-full text-center font-sans text-[11px] uppercase tracking-[0.14em] text-ink-soft hover:text-terracotta transition-colors" data-testid="cart-clear">
                Clear cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

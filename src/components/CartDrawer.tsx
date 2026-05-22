import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { inr, inr2, toInrAmount } from "@/lib/currency";

const CartDrawer = () => {
  const { items, isOpen, closeCart, setQty, remove, openCheckout } = useCart();
  const subtotal = items.reduce((sum, item) => sum + toInrAmount(item.price) * item.qty, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background border-l border-gold/30 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-gold/20">
          <SheetTitle className="font-display text-2xl text-gold-gradient inline-flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" /> Your Royal Bag
          </SheetTitle>
          <SheetDescription className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {items.length === 0 ? "Empty — add a piece" : `${items.length} item${items.length > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 && (
            <div className="text-center text-muted-foreground py-20 text-sm">
              Your bag is awaiting greatness.
            </div>
          )}
          {items.map((it) => (
            <div key={it.id} className="flex gap-4 glass gold-border rounded-2xl p-3">
              <img src={it.img} alt={it.name} className="w-20 h-20 rounded-xl object-cover bg-noir-soft" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-sm truncate">{it.name}</div>
                  <button onClick={() => remove(it.id)} aria-label="Remove" className="text-gold/70 hover:text-gold">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-gold-gradient font-bold text-sm mt-1">{inr(it.price)}</div>
                <div className="mt-2 inline-flex items-center gap-2 glass gold-border rounded-full px-1 py-0.5">
                  <button onClick={() => setQty(it.id, it.qty - 1)} aria-label="Decrease" className="w-6 h-6 grid place-items-center text-gold hover:bg-gold/10 rounded-full">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm w-6 text-center">{it.qty}</span>
                  <button onClick={() => setQty(it.id, it.qty + 1)} aria-label="Increase" className="w-6 h-6 grid place-items-center text-gold hover:bg-gold/10 rounded-full">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gold/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Subtotal</span>
            <span className="text-2xl font-bold text-gold-gradient">{inr2(subtotal)}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={openCheckout}
            className="w-full bg-gradient-gold text-noir rounded-full py-3 text-xs uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2 shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
export default CartDrawer;

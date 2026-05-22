import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  img: string;
  item_type?: "product" | "course";
  allow_pay_now?: boolean;
  allow_cod?: boolean;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

const KEY = "zyvanta_cart_v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const value = useMemo<CartCtx>(() => ({
    items,
    count: items.reduce((a, b) => a + b.qty, 0),
    total: items.reduce((a, b) => a + b.qty * b.price, 0),
    isOpen,
    add: (item, qty = 1) => setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) return prev.map((p) => p.id === item.id ? { ...p, qty: p.qty + qty } : p);
      return [...prev, { ...item, qty }];
    }),
    remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
    setQty: (id, qty) => setItems((prev) => qty <= 0
      ? prev.filter((p) => p.id !== id)
      : prev.map((p) => p.id === id ? { ...p, qty } : p)),
    clear: () => setItems([]),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    openCheckout: () => { setIsOpen(false); window.location.assign("/checkout"); },
  }), [items, isOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
};

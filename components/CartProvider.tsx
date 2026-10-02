"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as cartRules from "@/lib/cart";
import { isDeliveryOptionId } from "@/lib/delivery";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, DeliveryOptionId } from "@/lib/types";

type CartStorage = "supabase" | "browser";

type CartContextValue = {
  items: CartItem[];
  /** "browser" means the cart_items table doesn't exist yet. */
  storage: CartStorage;
  count: number;
  syncError: string | null;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setDeliveryOption: (productId: string, id: DeliveryOptionId) => void;
  clear: () => void;
  /** Resolves once every change has been saved. */
  flush: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export const BROWSER_CART_PREFIX = "cart:";

function readBrowserCart(key: string): CartItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" &&
        Number.isInteger(item.quantity) &&
        isDeliveryOptionId(item.deliveryOptionId),
    );
  } catch {
    return [];
  }
}

export function CartProvider({
  userId,
  initialItems,
  storage,
  children,
}: {
  userId: string;
  initialItems: CartItem[];
  storage: CartStorage;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState(initialItems);
  const [syncError, setSyncError] = useState<string | null>(null);
  const itemsRef = useRef(items);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const browserKey = `${BROWSER_CART_PREFIX}${userId}`;

  useEffect(() => {
    if (storage !== "browser") return;
    const stored = readBrowserCart(browserKey);
    itemsRef.current = stored;
    setItems(stored);
  }, [storage, browserKey]);

  // Writes run one after another so they reach Supabase in order.
  const enqueue = useCallback((write: () => PromiseLike<{ error: unknown }>) => {
    queueRef.current = queueRef.current.then(async () => {
      const { error } = await write();
      if (error) {
        const { code, message } = error as { code?: string; message?: string };
        setSyncError(
          // cart_items.product_id must exist in the products table.
          code === "23503"
            ? "Your cart couldn't be saved: this product isn't in the store database yet. Load the catalog by running supabase/seed.sql in Supabase."
            : `Your cart couldn't be saved: ${message ?? "Unknown error"}`,
        );
        throw error;
      }
    }).catch(() => {});
  }, []);

  const saveItem = useCallback(
    (productId: string) => {
      if (storage === "browser") return;
      const item = itemsRef.current.find((entry) => entry.productId === productId);
      const supabase = createClient();

      if (!item) {
        enqueue(() =>
          supabase.from("cart_items").delete().eq("product_id", productId),
        );
        return;
      }

      enqueue(() =>
        supabase.from("cart_items").upsert(
          {
            user_id: userId,
            product_id: item.productId,
            quantity: item.quantity,
            delivery_option_id: item.deliveryOptionId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,product_id" },
        ),
      );
    },
    [enqueue, storage, userId],
  );

  const update = useCallback(
    (next: CartItem[], changedProductId?: string) => {
      itemsRef.current = next;
      setItems(next);
      setSyncError(null);

      if (storage === "browser") {
        try {
          localStorage.setItem(browserKey, JSON.stringify(next));
        } catch {
          // Storage can be unavailable (private mode); the cart still works
          // for this visit.
        }
      } else if (changedProductId) {
        saveItem(changedProductId);
      }
    },
    [browserKey, saveItem, storage],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      storage,
      count: cartRules.countItems(items),
      syncError,
      addItem: (productId, quantity = 1) =>
        update(cartRules.addToCart(itemsRef.current, productId, quantity), productId),
      removeItem: (productId) =>
        update(cartRules.removeFromCart(itemsRef.current, productId), productId),
      setQuantity: (productId, quantity) =>
        update(cartRules.setQuantity(itemsRef.current, productId, quantity), productId),
      setDeliveryOption: (productId, id) =>
        update(cartRules.setDeliveryOption(itemsRef.current, productId, id), productId),
      // The server empties cart_items when an order is placed, so only
      // local state needs clearing here.
      clear: () => update([]),
      flush: () => queueRef.current,
    }),
    [items, storage, syncError, update],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside <CartProvider>.");
  return cart;
}

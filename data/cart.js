export let cart;

import { requireSupabase, supabase } from "../lib/supabase.js";

let userId = null;
let cartSyncQueue = Promise.resolve();

loadFromStorage();

export function loadFromStorage() {
  cart = readStoredCart(userId ? `cart:${userId}` : "cart");
}

export function saveToStorage() {
  const snapshot = structuredClone(cart);
  localStorage.setItem(
    userId ? `cart:${userId}` : "cart",
    JSON.stringify(snapshot),
  );
  queueCartSync(snapshot);
}

function readStoredCart(key) {
  try {
    const storedCart = JSON.parse(localStorage.getItem(key));
    return Array.isArray(storedCart) ? storedCart : [];
  } catch {
    return [];
  }
}

export async function loadCartForCurrentUser() {
  const client = requireSupabase();
  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userResult.user) {
    userId = null;
    cart = [];
    return cart;
  }

  userId = userResult.user.id;
  const storedCart = readStoredCart(`cart:${userId}`);
  const { data, error } = await client
    .from("cart_items")
    .select("product_id, quantity, delivery_option_id")
    .eq("user_id", userId);

  if (error) throw error;

  cart = data.length
    ? data.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        deliveryOptionId: item.delivery_option_id,
      }))
    : storedCart;

  localStorage.setItem(`cart:${userId}`, JSON.stringify(cart));
  if (!data.length && cart.length) queueCartSync(structuredClone(cart));
  return cart;
}

export async function flushCartSync() {
  await cartSyncQueue;
}

function queueCartSync(snapshot) {
  if (!userId || !supabase) return;

  const syncUserId = userId;
  cartSyncQueue = cartSyncQueue
    .catch(() => {})
    .then(async () => {
      const client = requireSupabase();
      const { data: existingItems, error: loadError } = await client
        .from("cart_items")
        .select("product_id")
        .eq("user_id", syncUserId);
      if (loadError) throw loadError;

      const nextProductIds = new Set(snapshot.map((item) => item.productId));
      const removedProductIds = existingItems
        .map((item) => item.product_id)
        .filter((productId) => !nextProductIds.has(productId));

      if (removedProductIds.length) {
        const { error } = await client
          .from("cart_items")
          .delete()
          .eq("user_id", syncUserId)
          .in("product_id", removedProductIds);
        if (error) throw error;
      }

      if (snapshot.length) {
        const { error } = await client.from("cart_items").upsert(
          snapshot.map((item) => ({
            user_id: syncUserId,
            product_id: item.productId,
            quantity: item.quantity,
            delivery_option_id: item.deliveryOptionId,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "user_id,product_id" },
        );
        if (error) throw error;
      }
    })
    .catch((error) => {
      console.error("Could not sync cart with Supabase:", error.message);
      throw error;
    });

  cartSyncQueue.catch(() => {});
}

export function addToCart(productId) {
  let matchingItem;

  // Checks if product already exists.
  cart.forEach((cartItem) => {
    if (productId === cartItem.productId) {
      matchingItem = cartItem;
    }
  });

  if (matchingItem) {
    matchingItem.quantity += 1;
  } else {
    cart.push({
      productId,
      quantity: 1,
      deliveryOptionId: "1",
    });
  }

  saveToStorage();
}

// remove items from cart.
export function removeItemFromCart(productId) {
  const newCart = [];

  cart.forEach((cartItem) => {
    if (productId !== cartItem.productId) {
      newCart.push(cartItem);
    }
  });
  cart = newCart;
  saveToStorage();
}

export function updateDeliveryOption(productId, deliveryOptionId) {
  let matchingItem;

  cart.forEach((cartItem) => {
    if (productId === cartItem.productId) {
      matchingItem = cartItem;
    }
  });

  matchingItem.deliveryOptionId = deliveryOptionId;
  saveToStorage();
}

export function clearCart() {
  cart = [];
  saveToStorage();
}

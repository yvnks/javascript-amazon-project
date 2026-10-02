import { getDeliveryOption } from "./delivery";
import type { CartItem, DeliveryOptionId, Product } from "./types";

export const MAX_QUANTITY = 99;
export const TAX_RATE = 0.1;

function clampQuantity(quantity: number) {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)));
}

export function addToCart(
  cart: CartItem[],
  productId: string,
  quantity = 1,
): CartItem[] {
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    return cart.map((item) =>
      item === existing
        ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
        : item,
    );
  }
  return [
    ...cart,
    { productId, quantity: clampQuantity(quantity), deliveryOptionId: "1" },
  ];
}

export function removeFromCart(cart: CartItem[], productId: string) {
  return cart.filter((item) => item.productId !== productId);
}

export function setQuantity(
  cart: CartItem[],
  productId: string,
  quantity: number,
) {
  return cart.map((item) =>
    item.productId === productId
      ? { ...item, quantity: clampQuantity(quantity) }
      : item,
  );
}

export function setDeliveryOption(
  cart: CartItem[],
  productId: string,
  deliveryOptionId: DeliveryOptionId,
) {
  return cart.map((item) =>
    item.productId === productId ? { ...item, deliveryOptionId } : item,
  );
}

export function countItems(cart: CartItem[]) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

// Mirrors the totals place_order_from_cart() charges.
export function summarizeCart(
  cart: CartItem[],
  productsById: Map<string, Product>,
) {
  let itemsCents = 0;
  let shippingCents = 0;

  for (const item of cart) {
    const product = productsById.get(item.productId);
    if (!product) continue;
    itemsCents += product.priceCents * item.quantity;
    shippingCents += getDeliveryOption(item.deliveryOptionId).priceCents;
  }

  const beforeTaxCents = itemsCents + shippingCents;
  const taxCents = Math.round(beforeTaxCents * TAX_RATE);

  return {
    itemCount: countItems(cart),
    itemsCents,
    shippingCents,
    beforeTaxCents,
    taxCents,
    totalCents: beforeTaxCents + taxCents,
  };
}

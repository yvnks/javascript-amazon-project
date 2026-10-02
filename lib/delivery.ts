import type { DeliveryOptionId } from "./types";

// Must match the delivery cases in place_order_from_cart()
// (supabase/migrations/20261002000000_store_backend.sql).
export const deliveryOptions: {
  id: DeliveryOptionId;
  deliveryDays: number;
  priceCents: number;
}[] = [
  { id: "1", deliveryDays: 7, priceCents: 0 },
  { id: "2", deliveryDays: 3, priceCents: 499 },
  { id: "3", deliveryDays: 1, priceCents: 999 },
];

export function getDeliveryOption(id: string) {
  return deliveryOptions.find((option) => option.id === id) ?? deliveryOptions[0];
}

export function isDeliveryOptionId(id: unknown): id is DeliveryOptionId {
  return deliveryOptions.some((option) => option.id === id);
}

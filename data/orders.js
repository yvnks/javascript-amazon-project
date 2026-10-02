import { requireSupabase } from "../lib/supabase.js";
import { flushCartSync } from "./cart.js";

const ORDER_SELECT =
  "id, total_cents, status, created_at, order_items(id, product_id, product_name, product_image, price_cents, quantity, delivery_option_id, estimated_delivery_at)";

function normalizeOrder(row) {
  return {
    id: row.id,
    orderTime: row.created_at,
    totalCostCents: row.total_cents,
    status: row.status,
    products: (row.order_items || []).map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
      deliveryOptionId: item.delivery_option_id,
      estimatedDeliveryTime: item.estimated_delivery_at,
      name: item.product_name,
      image: item.product_image,
      priceCents: item.price_cents,
    })),
  };
}

export async function loadOrders() {
  const { data, error } = await requireSupabase()
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(normalizeOrder);
}

export async function getOrderById(orderId) {
  const { data, error } = await requireSupabase()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeOrder(data) : null;
}

export async function createOrderFromCart() {
  await flushCartSync();

  const { data, error } = await requireSupabase().rpc("place_order_from_cart");
  if (error) throw error;
  return data;
}

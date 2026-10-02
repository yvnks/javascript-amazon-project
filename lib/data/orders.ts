import "server-only";
import { isDeliveryOptionId } from "@/lib/delivery";
import { publicImagePath } from "@/lib/format";
import { isMissingTableError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/lib/types";

const ORDER_SELECT =
  "id, total_cents, status, created_at, order_items(id, product_id, product_name, product_image, price_cents, quantity, delivery_option_id, estimated_delivery_at)";

type OrderRow = {
  id: string;
  total_cents: number;
  status: OrderStatus;
  created_at: string;
  order_items: {
    id: number;
    product_id: string;
    product_name: string;
    product_image: string;
    price_cents: number;
    quantity: number;
    delivery_option_id: string;
    estimated_delivery_at: string;
  }[];
};

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    totalCents: row.total_cents,
    status: row.status,
    items: [...(row.order_items ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((item) => ({
        productId: item.product_id,
        name: item.product_name,
        image: publicImagePath(item.product_image),
        priceCents: item.price_cents,
        quantity: item.quantity,
        deliveryOptionId: isDeliveryOptionId(item.delivery_option_id)
          ? item.delivery_option_id
          : "1",
        estimatedDeliveryDate: item.estimated_delivery_at,
      })),
  };
}

export class OrdersUnavailableError extends Error {
  constructor() {
    super(
      "Orders aren't set up in Supabase yet. Apply supabase/migrations/20261002000000_store_backend.sql to enable them.",
    );
  }
}

// Row-level security limits these queries to the signed-in user's orders.
export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (isMissingTableError(error)) throw new OrdersUnavailableError();
  if (error) throw error;
  return (data as OrderRow[]).map(fromRow);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle();

  if (isMissingTableError(error)) throw new OrdersUnavailableError();
  // An id that isn't a valid uuid can't match any order.
  if (error?.code === "22P02") return null;
  if (error) throw error;
  return data ? fromRow(data as OrderRow) : null;
}

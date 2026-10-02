import "server-only";
import { isDeliveryOptionId } from "@/lib/delivery";
import { isMissingTableError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types";

export type CartStorage = "supabase" | "browser";

// The cart lives in the cart_items table. If the migration hasn't been
// applied yet, the browser keeps it instead (see components/CartProvider).
export async function getCart(): Promise<{
  items: CartItem[];
  storage: CartStorage;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity, delivery_option_id")
    .order("updated_at");

  if (isMissingTableError(error)) return { items: [], storage: "browser" };
  if (error) throw error;

  return {
    storage: "supabase",
    items: data.map((row) => ({
      productId: row.product_id,
      quantity: row.quantity,
      deliveryOptionId: isDeliveryOptionId(row.delivery_option_id)
        ? row.delivery_option_id
        : "1",
    })),
  };
}

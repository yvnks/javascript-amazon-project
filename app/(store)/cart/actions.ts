"use server";

import { headers } from "next/headers";
import { getDisplayName } from "@/lib/auth";
import { getOrder } from "@/lib/data/orders";
import { isEmailConfigured, sendEmail } from "@/lib/email/mailer";
import { buildOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type PlaceOrderResult =
  | { ok: true; orderId: string; emailSent: boolean }
  | { ok: false; error: string };

// Places the signed-in user's saved cart as an order, then emails them a
// confirmation. A failed email never undoes the order.
export async function placeOrder(): Promise<PlaceOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has ended. Sign in again to place your order." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order_from_cart");

  if (error) {
    return {
      ok: false,
      error:
        error.code === "PGRST202"
          ? "Checkout isn't set up in Supabase yet, so orders can't be placed."
          : error.message || "Could not place your order. Please try again.",
    };
  }

  const orderId = (data as { id: string }).id;
  return { ok: true, orderId, emailSent: await sendConfirmation(orderId, user) };
}

async function sendConfirmation(
  orderId: string,
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
) {
  if (!user.email) return false;
  if (!isEmailConfigured()) {
    console.warn(`Order ${orderId} placed; no confirmation email sent because SMTP isn't configured.`);
    return false;
  }

  try {
    const order = await getOrder(orderId);
    if (!order) throw new Error("the new order could not be read back");

    const requestHeaders = await headers();
    const origin =
      requestHeaders.get("origin") ??
      `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;

    const email = buildOrderConfirmationEmail({
      order,
      customerName: getDisplayName(user),
      ordersUrl: new URL("/orders", origin).href,
    });
    await sendEmail({ to: user.email, ...email });
    return true;
  } catch (error) {
    console.error(`Order ${orderId} placed, but the confirmation email failed:`, (error as Error).message);
    return false;
  }
}

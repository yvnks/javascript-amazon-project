import { describe, expect, it } from "vitest";
import { buildOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import type { Order } from "@/lib/types";

const order: Order = {
  id: "4fed786f-17d9-4fc0-98a5-c269452d70e3",
  createdAt: "2026-10-02T10:00:00Z",
  status: "preparing",
  // Items 4275 + shipping 499 + 10% tax 477
  totalCents: 5251,
  items: [
    {
      productId: "a",
      name: "Black and Gray Athletic Cotton Socks - 6 Pairs",
      image: "/images/a.jpg",
      priceCents: 1090,
      quantity: 2,
      deliveryOptionId: "1",
      estimatedDeliveryDate: "2026-10-09",
    },
    {
      productId: "b",
      name: "Women's <b>Bold</b> & Co",
      image: "/images/b.jpg",
      priceCents: 2095,
      quantity: 1,
      deliveryOptionId: "2",
      estimatedDeliveryDate: "2026-10-05",
    },
  ],
};

const email = buildOrderConfirmationEmail({
  order,
  customerName: "Ama",
  ordersUrl: "http://127.0.0.1:5173/orders",
});

describe("order confirmation email", () => {
  it("names the order in the subject", () => {
    expect(email.subject).toBe("Your Soma order #4FED786F is confirmed");
  });

  it("breaks down the total the customer was charged", () => {
    for (const part of ["Items: $42.75", "Shipping: $4.99", "Tax: $4.77", "Total: $52.51"]) {
      expect(email.text).toContain(part);
    }
  });

  it("lists each item with its delivery date", () => {
    expect(email.text).toContain(
      "- Black and Gray Athletic Cotton Socks - 6 Pairs × 2: $21.80 (arrives Friday, October 9)",
    );
  });

  it("escapes product names in the HTML", () => {
    expect(email.html).toContain("Women&#39;s &lt;b&gt;Bold&lt;/b&gt; &amp; Co");
    expect(email.html).not.toContain("<b>Bold</b>");
  });

  it("links to the orders page", () => {
    expect(email.html).toContain('href="http://127.0.0.1:5173/orders"');
    expect(email.text).toContain("Track your order: http://127.0.0.1:5173/orders");
  });
});

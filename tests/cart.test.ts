import { describe, expect, it } from "vitest";
import {
  addToCart,
  countItems,
  MAX_QUANTITY,
  removeFromCart,
  setDeliveryOption,
  setQuantity,
  summarizeCart,
} from "@/lib/cart";
import type { CartItem, Product } from "@/lib/types";

const socks = "e43638ce-6aa0-4b85-b27f-e1d07eb678c6";
const ball = "15b6fc6f-327a-4ec4-896f-486349e85a3d";

function product(id: string, priceCents: number): Product {
  return {
    id,
    image: "/images/x.jpg",
    name: id,
    rating: { stars: 4, count: 1 },
    priceCents,
    keywords: [],
    type: null,
    sizeChartLink: null,
  };
}

describe("cart rules", () => {
  it("adds a new product with the free delivery option", () => {
    expect(addToCart([], socks, 2)).toEqual([
      { productId: socks, quantity: 2, deliveryOptionId: "1" },
    ]);
  });

  it("adds to the quantity of a product already in the cart", () => {
    const cart: CartItem[] = [{ productId: socks, quantity: 2, deliveryOptionId: "2" }];
    expect(addToCart(cart, socks, 3)).toEqual([
      { productId: socks, quantity: 5, deliveryOptionId: "2" },
    ]);
  });

  it("keeps quantities between 1 and the database limit", () => {
    const cart: CartItem[] = [{ productId: socks, quantity: 98, deliveryOptionId: "1" }];
    expect(addToCart(cart, socks, 5)[0].quantity).toBe(MAX_QUANTITY);
    expect(setQuantity(cart, socks, 0)[0].quantity).toBe(1);
  });

  it("removes a product and leaves the others", () => {
    const cart = addToCart(addToCart([], socks), ball);
    expect(removeFromCart(cart, socks)).toEqual([
      { productId: ball, quantity: 1, deliveryOptionId: "1" },
    ]);
  });

  it("does not change the original cart", () => {
    const cart: CartItem[] = [{ productId: socks, quantity: 1, deliveryOptionId: "1" }];
    setDeliveryOption(cart, socks, "3");
    expect(cart[0].deliveryOptionId).toBe("1");
  });

  it("totals items, shipping and 10% tax like place_order_from_cart()", () => {
    const cart: CartItem[] = [
      { productId: socks, quantity: 2, deliveryOptionId: "1" },
      { productId: ball, quantity: 1, deliveryOptionId: "2" },
    ];
    const products = new Map([
      [socks, product(socks, 1090)],
      [ball, product(ball, 2095)],
    ]);

    expect(countItems(cart)).toBe(3);
    expect(summarizeCart(cart, products)).toEqual({
      itemCount: 3,
      itemsCents: 4275,
      shippingCents: 499,
      beforeTaxCents: 4774,
      taxCents: 477,
      totalCents: 5251,
    });
  });
});

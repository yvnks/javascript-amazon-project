import renderOrderSummary from "../../scripts/checkout/orderSummary.js";
import { loadFromStorage, cart } from "../../data/cart.js";
import { Clothing, Product, products } from "../../data/products.js";

describe("test suite: renderOrderSummary: ", () => {
  const productId1 = "e43638ce-6aa0-4b85-b27f-e1d07eb678c6";
  const productId2 = "15b6fc6f-327a-4ec4-896f-486349e85a3d";

  beforeAll(async () => {
    const response = await fetch("/backend/products.json");
    const productDetails = await response.json();
    products.push(
      ...productDetails.map((product) =>
        product.type === "clothing"
          ? new Clothing(product)
          : new Product(product),
      ),
    );
  });

  beforeEach(() => {
    spyOn(localStorage, "setItem");
    const container = document.querySelector(".js-test-container");
    const div = document.createElement("div");
    div.classList.add("js-order-summary");

    const paymentSummaryDiv = document.createElement("div");
    paymentSummaryDiv.classList.add("js-payment-summary");

    container.appendChild(div);
    container.appendChild(paymentSummaryDiv);
    spyOn(localStorage, "getItem").and.callFake(() => {
      return JSON.stringify([
        {
          productId: productId1,
          quantity: 2,
          deliveryOptionId: "1",
        },
        {
          productId: productId2,
          quantity: 1,
          deliveryOptionId: "2",
        },
      ]);
    });
    loadFromStorage();

    renderOrderSummary();
  });

  afterEach(() => {
    document.querySelector(".js-test-container").innerHTML = "";
  });

  it("displays the cart: ", () => {
    expect(document.querySelectorAll(".js-cart-item-container").length).toEqual(
      2,
    );

    // product 1
    expect(
      document.querySelector(`.js-product-quantity-${productId1}`).innerText,
    ).toContain("Quantity: 2");

    // product 2
    expect(
      document.querySelector(`.js-product-quantity-${productId2}`).innerText,
    ).toContain("Quantity: 1");
  });

  // test how the page behaves (delete-link)
  it("removes a product from the page:", () => {
    document.querySelector(`.js-delete-link-${productId1}`).click();
    expect(document.querySelectorAll(".js-cart-item-container").length).toEqual(
      1,
    );
    // confirm first prod has been removed.
    expect(
      document.querySelector(`.js-cart-item-container-${productId1}`),
    ).toBeNull();

    expect(
      document.querySelector(`.js-cart-item-container-${productId2}`),
    ).not.toBeNull();

    expect(cart.length).toEqual(1);
    expect(cart[0].productId).toEqual(productId2);
  });
});

console.log();

import renderOrderSummary from "./checkout/orderSummary.js";
import renderPaymentSummary from "./checkout/paymentSummary.js";
// import "../data/backend-practice.js";
import { loadProductsFromFetch } from "../data/products.js";
import { loadCartForCurrentUser } from "../data/cart.js";

async function loadPage() {
  console.log("async load page");

  await Promise.all([loadProductsFromFetch(), loadCartForCurrentUser()]);

  renderOrderSummary();
  renderPaymentSummary();
}

loadPage();

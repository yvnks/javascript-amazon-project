import renderOrderSummary from "./checkout/orderSummary.js";
import renderPaymentSummary from "./checkout/paymentSummary.js";
// import "../data/backend-practice.js";
import { loadProductsFromFetch } from "../data/products.js";
import { loadCartForCurrentUser } from "../data/cart.js";
import { currentUserReady } from "./auth-guard.js";

async function loadPage() {
  await currentUserReady;
  await Promise.all([loadProductsFromFetch(), loadCartForCurrentUser()]);

  renderOrderSummary();
  renderPaymentSummary();
}

loadPage();

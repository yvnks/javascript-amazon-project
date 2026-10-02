import { getOrderById } from "./orders.js";
import { cart, loadCartForCurrentUser } from "./cart.js";
import { formatDate } from "../scripts/utils/date.js";

async function renderTrackingHTML() {
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");
  const productId = url.searchParams.get("productId");
  const trackingContainer = document.querySelector(".js-order-tracking");

  try {
    const [, order] = await Promise.all([
      loadCartForCurrentUser(),
      getOrderById(orderId),
    ]);
    const orderItem = order?.products.find(
      (item) => item.productId === productId,
    );

    const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector(".js-cart-quantity").textContent = cartQuantity;

    if (!order || !orderItem) {
      trackingContainer.textContent = "We could not find that order item.";
      return;
    }

    const steps = ["Preparing", "Shipped", "Delivered"];
    const currentStep = Math.max(
      0,
      steps.indexOf(order.status[0].toUpperCase() + order.status.slice(1)),
    );
    const progress = [20, 60, 100][currentStep];
    const arrivalDate = formatDate(orderItem.estimatedDeliveryTime, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    trackingContainer.innerHTML = `
  <a class="back-to-orders-link link-primary" href="orders.html">
          View all orders
        </a>

        <div class="delivery-date">
          Arriving on ${arrivalDate}
        </div>

        <div class="product-info">
          ${orderItem.name}
        </div>

        <div class="product-info">Quantity: ${orderItem.quantity}</div>

        <img
          class="product-image"
          src="${orderItem.image}"
          alt="${orderItem.name}"
        />

        <div class="progress-labels-container">
          ${steps.map((step, index) => `<div class="progress-label ${index === currentStep ? "current-status" : ""}">${step}</div>`).join("")}
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
    `;
  } catch (error) {
    trackingContainer.textContent = `Could not load tracking: ${error.message}`;
  }
}

renderTrackingHTML();

import { getOrderById } from "./orders.js";
import { cart, loadCartForCurrentUser } from "./cart.js";
import { formatDate } from "../scripts/utils/date.js";
import { renderCartQuantity } from "../scripts/utils/cartQuantity.js";
import { currentUserReady } from "../scripts/auth-guard.js";

async function renderTrackingHTML() {
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");
  const productId = url.searchParams.get("productId");
  const trackingContainer = document.querySelector(".js-order-tracking");

  try {
    await currentUserReady;
    const [, order] = await Promise.all([
      loadCartForCurrentUser(),
      getOrderById(orderId),
    ]);
    const orderItem = order?.products.find(
      (item) => item.productId === productId,
    );

    renderCartQuantity(cart);

    if (!order || !orderItem) {
      trackingContainer.innerHTML = `<p class="status-message">We could not find that order item.</p>`;
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

        <div class="tracking-card card">
          <div class="tracking-product">
            <div class="product-image-container">
              <img class="product-image" src="${orderItem.image}" alt="" />
            </div>

            <div>
              <div class="delivery-date">Arriving on ${arrivalDate}</div>
              <div class="product-info product-name">${orderItem.name}</div>
              <div class="product-info">Quantity: ${orderItem.quantity}</div>
            </div>
          </div>

          <div class="progress-labels-container">
            ${steps.map((step, index) => `<div class="progress-label ${index <= currentStep ? "is-complete" : ""} ${index === currentStep ? "current-status" : ""}">${step}</div>`).join("")}
          </div>

          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
        </div>
    `;
  } catch (error) {
    trackingContainer.innerHTML = `<p class="status-message"></p>`;
    trackingContainer.firstElementChild.textContent = `Could not load tracking: ${error.message}`;
  }
}

renderTrackingHTML();

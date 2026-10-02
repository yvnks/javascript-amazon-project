import { loadCartForCurrentUser, cart, addToCart } from "../data/cart.js";
import { loadOrders } from "../data/orders.js";
import { formatCurrency } from "./utils/money.js";
import { formatDate } from "./utils/date.js";
import { renderCartQuantity } from "./utils/cartQuantity.js";
import { currentUserReady } from "./auth-guard.js";

const buyAgainTimeouts = new Map();

function formatStatus(status) {
  if (!status) return "";
  return status[0].toUpperCase() + status.slice(1);
}

function renderOrders(orders) {
  let html = "";

  orders.forEach((order) => {
    let itemsHtml = "";

    order.products.forEach((item) => {
      itemsHtml += `
        <div class="order-details-grid">
          <div class="product-image-container">
            <img src="${item.image}" alt="" />
          </div>
          <div class="product-details">
            <div class="product-name limit-text-to-2-lines">${item.name}</div>
            <div class="product-delivery-date">Arriving ${formatDate(item.estimatedDeliveryTime, { weekday: "short", month: "long", day: "numeric" })}</div>
            <div class="product-quantity">Quantity: ${item.quantity}</div>
          </div>
          <div class="product-actions">
            <button class="buy-again-button button-primary js-buy-again-button" type="button" data-product-id="${item.productId}">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
              <span class="buy-again-message">Buy it again</span>
            </button>
            <a class="track-package-button button-secondary"
              href="tracking.html?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(item.productId)}">
              Track package
            </a>
          </div>
        </div>
      `;
    });

    html += `
      <section class="order-card card">
        <div class="order-header">
          <div class="order-header-item">
            <div class="order-header-label">Order placed</div>
            <div>${formatDate(order.orderTime, { month: "long", day: "numeric" })}</div>
          </div>
          <div class="order-header-item">
            <div class="order-header-label">Total</div>
            <div>$${formatCurrency(order.totalCostCents)}</div>
          </div>
          <div class="order-header-item order-id">
            <div class="order-header-label">Order ID</div>
            <div>${order.id}</div>
          </div>
          <span class="order-status">${formatStatus(order.status)}</span>
        </div>
        ${itemsHtml}
      </section>
    `;
  });

  const container = document.querySelector(".js-order-container");
  container.innerHTML =
    html ||
    `<div class="empty-orders card">
      <p class="empty-orders-title">No orders yet</p>
      <p class="empty-orders-text">When you place an order it will show up here.</p>
      <a class="button-primary" href="amazon.html">Start shopping</a>
    </div>`;

  document.querySelectorAll(".js-buy-again-button").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.productId);
      renderCartQuantity(cart);
      showAddedState(button);
    });
  });
}

function showAddedState(button) {
  const message = button.querySelector(".buy-again-message");
  button.classList.add("is-added");
  message.innerHTML = `<img class="added-check" src="images/icons/checkmark.png" alt="" /> Added`;

  clearTimeout(buyAgainTimeouts.get(button));
  buyAgainTimeouts.set(
    button,
    setTimeout(() => {
      button.classList.remove("is-added");
      message.textContent = "Buy it again";
    }, 2000),
  );
}

async function initializeOrdersPage() {
  await currentUserReady;
  const [, orders] = await Promise.all([
    loadCartForCurrentUser(),
    loadOrders(),
  ]);
  renderCartQuantity(cart);
  renderOrders(orders);
}

initializeOrdersPage().catch((error) => {
  const container = document.querySelector(".js-order-container");
  container.innerHTML = `<p class="status-message"></p>`;
  container.firstElementChild.textContent = `Could not load orders: ${error.message}`;
});

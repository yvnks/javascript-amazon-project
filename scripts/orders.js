import { loadCartForCurrentUser, cart, addToCart } from "../data/cart.js";
import { loadOrders } from "../data/orders.js";
import { formatCurrency } from "./utils/money.js";
import { formatDate } from "./utils/date.js";

function updateCartQuantity() {
  const quantity = cart.reduce((total, item) => total + item.quantity, 0);
  const quantityElement = document.querySelector(".js-cart-quantity");
  if (quantityElement) quantityElement.textContent = quantity;
}

function renderOrders(orders) {
  let html = "";

  orders.forEach((order) => {
    html += `
      <div class="order-header">
        <div class="order-header-left-section">
          <div class="order-date">
            <div class="order-header-label">Order Placed:</div>
            <div>${formatDate(order.orderTime, { month: "long", day: "numeric" })}</div>
          </div>
          <div class="order-total">
            <div class="order-header-label">Total:</div>
            <div>$${formatCurrency(order.totalCostCents)}</div>
          </div>
        </div>
        <div class="order-header-right-section">
          <div class="order-header-label">Order ID:</div>
          <div>${order.id}</div>
        </div>
      </div>
    `;

    order.products.forEach((item) => {
      html += `
        <div class="order-details-grid">
          <div class="product-image-container">
            <img src="${item.image}" alt="${item.name}" />
          </div>
          <div class="product-details">
            <div class="product-name">${item.name}</div>
            <div class="product-delivery-date">Arriving on: ${formatDate(item.estimatedDeliveryTime, { month: "long", day: "numeric" })}</div>
            <div class="product-quantity">Quantity: ${item.quantity}</div>
            <button class="buy-again-button button-primary js-buy-again-button" data-product-id="${item.productId}">
              <img class="buy-again-icon" src="images/icons/buy-again.png" alt="" />
              <span class="buy-again-message">Buy it again</span>
            </button>
          </div>
          <div class="product-actions">
            <a href="tracking.html?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(item.productId)}">
              <button class="track-package-button button-secondary">Track package</button>
            </a>
          </div>
        </div>
      `;
    });
  });

  const container = document.querySelector(".js-order-container");
  container.innerHTML = html || "<p>You have no orders yet.</p>";

  document.querySelectorAll(".js-buy-again-button").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.productId);
      updateCartQuantity();
    });
  });
}

async function initializeOrdersPage() {
  const [, orders] = await Promise.all([
    loadCartForCurrentUser(),
    loadOrders(),
  ]);
  updateCartQuantity();
  renderOrders(orders);
}

initializeOrdersPage().catch((error) => {
  const container = document.querySelector(".js-order-container");
  container.textContent = `Could not load orders: ${error.message}`;
});

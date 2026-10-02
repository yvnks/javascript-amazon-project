import { getDisplayName } from "../data/auth.js";
import { formatDate } from "./utils/date.js";
import { formatCurrency } from "./utils/money.js";
import { cart, loadCartForCurrentUser } from "../data/cart.js";
import { loadOrders } from "../data/orders.js";
import { renderCartQuantity } from "./utils/cartQuantity.js";
import { currentUserReady } from "./auth-guard.js";

const HISTORY_LIMIT = 5;

function renderDetails(user) {
  document.querySelector("[data-profile-name]").textContent =
    getDisplayName(user);
  document.querySelector("[data-profile-email]").textContent =
    user.email || "Not available";

  const provider = user.app_metadata?.provider || "email";
  document.querySelector("[data-profile-provider]").textContent =
    provider === "google"
      ? "Google"
      : provider.charAt(0).toUpperCase() + provider.slice(1);
  document.querySelector("[data-profile-created]").textContent =
    user.created_at
      ? formatDate(user.created_at, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Not available";
}

function renderHistory(orders) {
  const items = orders.flatMap((order) =>
    order.products.map((item) => ({ ...item, order })),
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalSpentCents = orders.reduce(
    (total, order) => total + order.totalCostCents,
    0,
  );

  document.querySelector(".js-history-stats").innerHTML = `
    <div class="history-stat">
      <span class="history-stat-value">${orders.length}</span>
      <span class="history-stat-label">${orders.length === 1 ? "Order" : "Orders"}</span>
    </div>
    <div class="history-stat">
      <span class="history-stat-value">${itemCount}</span>
      <span class="history-stat-label">${itemCount === 1 ? "Item" : "Items"}</span>
    </div>
    <div class="history-stat">
      <span class="history-stat-value">$${formatCurrency(totalSpentCents)}</span>
      <span class="history-stat-label">Spent</span>
    </div>
  `;

  const list = document.querySelector(".js-history-list");
  if (!items.length) {
    list.innerHTML = `<p class="history-empty">You haven't bought anything yet. Your purchases will show up here.</p>`;
    return;
  }

  list.innerHTML = items
    .slice(0, HISTORY_LIMIT)
    .map(
      (item) => `
        <li class="history-item">
          <div class="history-image">
            <img src="${item.image}" alt="" />
          </div>
          <div class="history-details">
            <div class="history-name limit-text-to-2-lines">${item.name}</div>
            <div class="history-meta">
              Ordered ${formatDate(item.order.orderTime, { month: "short", day: "numeric", year: "numeric" })}
              · Qty ${item.quantity}
            </div>
          </div>
          <a class="history-track"
            href="tracking.html?orderId=${encodeURIComponent(item.order.id)}&productId=${encodeURIComponent(item.productId)}">
            ${item.order.status ? item.order.status[0].toUpperCase() + item.order.status.slice(1) : "Track"}
          </a>
        </li>
      `,
    )
    .join("");
}

async function renderProfile() {
  const errorMessage = document.querySelector("[data-profile-error]");

  try {
    const user = await currentUserReady;
    renderDetails(user);

    const [, orders] = await Promise.all([
      loadCartForCurrentUser(),
      loadOrders(),
    ]);
    renderCartQuantity(cart);
    renderHistory(orders);
  } catch (error) {
    errorMessage.textContent = `Could not load your account details: ${error.message}`;
  }
}

renderProfile();

import { cart, addToCart, loadCartForCurrentUser } from "../data/cart.js";
import { products, loadProductsFromFetch } from "../data/products.js";
import { renderCartQuantity } from "./utils/cartQuantity.js";
import { currentUserReady } from "./auth-guard.js";

const searchForm = document.querySelector(".js-search-form");
const searchInput = document.querySelector(".js-search-input");
const sortSelect = document.querySelector(".js-sort-select");
const addedMessageTimeouts = {};

searchInput.value =
  new URLSearchParams(window.location.search).get("search") || "";

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase();

  const matchingProducts = products.filter((product) => {
    if (!query) return true;
    return (
      product.name.toLowerCase().includes(query) ||
      (product.keywords || []).some((keyword) =>
        keyword.toLowerCase().includes(query),
      )
    );
  });

  const sorters = {
    "price-asc": (a, b) => a.priceCents - b.priceCents,
    "price-desc": (a, b) => b.priceCents - a.priceCents,
    rating: (a, b) => b.rating.stars - a.rating.stars,
  };
  const sorter = sorters[sortSelect.value];
  return sorter ? [...matchingProducts].sort(sorter) : matchingProducts;
}

function renderProductsGrid() {
  renderCartQuantity(cart);
  const visibleProducts = getVisibleProducts();

  document.querySelector(".js-results-count").textContent =
    `${visibleProducts.length} ${visibleProducts.length === 1 ? "result" : "results"}`;

  let productsHtml = "";

  visibleProducts.forEach((product) => {
    const quantityOptions = Array.from(
      { length: 10 },
      (_, index) => `<option value="${index + 1}">${index + 1}</option>`,
    ).join("");

    productsHtml += `
      <article class="product-card">
        <div class="product-image-container">
          <img class="product-image" src="${product.image}" alt="" loading="lazy">

          <div class="added-to-cart js-added-to-cart-${product.id}" aria-hidden="true">
            <img src="images/icons/checkmark.png" alt="">
            Added
          </div>
        </div>

        <div class="product-body">
          <div class="product-name limit-text-to-2-lines">
            ${product.name}
          </div>

          <div class="product-extra">${product.extraInfoHTML()}</div>

          <div class="product-rating-container">
            <img class="product-rating-stars"
              src="${product.getStarsURL()}"
              alt="${product.rating.stars} out of 5 stars">
            <div class="product-rating-count">
              (${product.rating.count})
            </div>
          </div>

          <div class="product-meta">
            <div class="product-price">${product.getPrice()}</div>

            <label>
              <span class="visually-hidden">Quantity</span>
              <select class="quantity-select js-quantity-selector-${product.id}">
                ${quantityOptions}
              </select>
            </label>
          </div>

          <button class="add-to-cart-button js-add-to-cart button-primary"
            data-product-id="${product.id}">
            Add to cart
          </button>
        </div>
      </article>
    `;
  });

  const grid = document.querySelector(".js-products-grid");
  if (productsHtml) {
    grid.innerHTML = productsHtml;
  } else {
    grid.innerHTML = `<p class="status-message"></p>`;
    grid.firstElementChild.textContent = `No products match “${searchInput.value.trim()}”.`;
  }

  document.querySelectorAll(".js-add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const { productId } = button.dataset;
      const quantity = Number(
        document.querySelector(`.js-quantity-selector-${productId}`).value,
      );

      addToCart(productId, quantity);
      renderCartQuantity(cart);
      showAddedMessage(productId);
    });
  });
}

function showAddedMessage(productId) {
  const message = document.querySelector(`.js-added-to-cart-${productId}`);
  message.classList.add("is-visible");

  clearTimeout(addedMessageTimeouts[productId]);
  addedMessageTimeouts[productId] = setTimeout(() => {
    message.classList.remove("is-visible");
  }, 2000);
}

function focusSearchFromHash() {
  if (window.location.hash === "#search") searchInput.focus();
}

// Filter in place on the shop page instead of reloading it.
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchInput.blur();
});

searchInput.addEventListener("input", () => {
  const url = new URL(window.location.href);
  if (searchInput.value.trim()) {
    url.searchParams.set("search", searchInput.value.trim());
  } else {
    url.searchParams.delete("search");
  }
  history.replaceState(null, "", url);
  renderProductsGrid();
});

sortSelect.addEventListener("change", renderProductsGrid);
window.addEventListener("hashchange", focusSearchFromHash);
focusSearchFromHash();

// Tapping the Search tab while already on this page should still focus it.
document.querySelectorAll('a[href="amazon.html#search"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0 });
    searchInput.focus();
  });
});

currentUserReady
  .then(() => Promise.all([loadProductsFromFetch(), loadCartForCurrentUser()]))
  .then(() => {
    renderProductsGrid();
  })
  .catch((error) => {
    const grid = document.querySelector(".js-products-grid");
    grid.innerHTML = `<p class="status-message"></p>`;
    grid.firstElementChild.textContent = `Products could not be loaded: ${error.message}`;
  });

import {
  cart,
  removeItemFromCart,
  updateDeliveryOption,
  updateQuantity,
} from "../../data/cart.js";
import { getProduct } from "../../data/products.js";
import { formatCurrency } from "../utils/money.js";
import { addDays, formatDate } from "../utils/date.js";
import {
  deliveryOptions,
  getDeliveryOption,
} from "../../data/deliveryOptions.js";
import renderPaymentSummary from "./paymentSummary.js";

const MAX_QUANTITY = 99;

const trashIcon = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>`;
const minusIcon = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>`;
const plusIcon = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" /></svg>`;

function renderOrderSummary() {
  let cartQuantity = 0;
  let cartSummaryHTML = "";
  cart.forEach((cartItem) => {
    const productId = cartItem.productId;

    cartQuantity += cartItem.quantity;

    // Normalization -
    const matchingProduct = getProduct(productId);

    const deliveryOptionId = cartItem.deliveryOptionId;

    const deliveryOption = getDeliveryOption(deliveryOptionId);

    const deliveryDate = addDays(new Date(), deliveryOption.deliveryDays);
    const dateString = formatDate(deliveryDate, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    cartSummaryHTML += `
    <div class="cart-item-container card js-cart-item-container-${matchingProduct.id} js-cart-item-container">
        <div class="cart-item-details-grid">
            <div class="cart-item-image">
              <img class="product-image" src="${matchingProduct.image}" alt="" />
            </div>

            <div class="cart-item-details">
              <div class="product-name limit-text-to-2-lines">
                  ${matchingProduct.name}
              </div>
              <div class="delivery-date">Arrives ${dateString}</div>
              <div class="product-price">${matchingProduct.getPrice()}</div>
            </div>
        </div>

        <div class="cart-item-actions">
            <div class="cart-item-subtotal">
              $${formatCurrency(matchingProduct.priceCents * cartItem.quantity)}
            </div>

            <button class="delete-quantity-link js-delete-quantity-link js-delete-link-${matchingProduct.id}"
              type="button"
              data-product-id="${matchingProduct.id}"
              aria-label="Remove ${matchingProduct.name}">
              ${trashIcon}
            </button>

            <div class="quantity-stepper product-quantity js-product-quantity-${matchingProduct.id}">
              <button class="js-quantity-step" type="button"
                data-product-id="${matchingProduct.id}" data-step="-1"
                aria-label="Decrease quantity"
                ${cartItem.quantity <= 1 ? "disabled" : ""}>
                ${minusIcon}
              </button>
              <span class="visually-hidden">Quantity: ${cartItem.quantity}</span>
              <span class="quantity-label" aria-hidden="true">${cartItem.quantity}</span>
              <button class="js-quantity-step" type="button"
                data-product-id="${matchingProduct.id}" data-step="1"
                aria-label="Increase quantity"
                ${cartItem.quantity >= MAX_QUANTITY ? "disabled" : ""}>
                ${plusIcon}
              </button>
            </div>
        </div>

        <div class="delivery-options-title">Choose a delivery option</div>
        <div class="delivery-options" role="radiogroup" aria-label="Delivery for ${matchingProduct.name}">
          ${deliveryOptionsHTML(matchingProduct, cartItem)}
        </div>
    </div>
    `;
  });

  document.querySelector(".js-order-summary").innerHTML =
    cartSummaryHTML ||
    `<div class="empty-cart card">
      <p class="empty-cart-title">Your cart is empty</p>
      <p class="empty-cart-text">Items you add will show up here.</p>
      <a class="button-primary" href="amazon.html">Continue shopping</a>
    </div>`;

  document.querySelectorAll(".js-delete-quantity-link").forEach((link) => {
    link.addEventListener("click", () => {
      const { productId } = link.dataset;
      removeItemFromCart(productId);
      renderPaymentSummary();
      renderOrderSummary();
    });
  });

  document.querySelectorAll(".js-quantity-step").forEach((button) => {
    button.addEventListener("click", () => {
      const { productId, step } = button.dataset;
      const cartItem = cart.find((item) => item.productId === productId);
      const nextQuantity = Math.min(
        MAX_QUANTITY,
        Math.max(1, cartItem.quantity + Number(step)),
      );
      updateQuantity(productId, nextQuantity);
      renderOrderSummary();
      renderPaymentSummary();
    });
  });

  function deliveryOptionsHTML(matchingProduct, cartItem) {
    let html = "";
    deliveryOptions.forEach((deliveryOption) => {
      const deliveryDate = addDays(new Date(), deliveryOption.deliveryDays);
      const dateString = formatDate(deliveryDate, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const priceString =
        deliveryOption.priceCents === 0
          ? "Free"
          : `$${formatCurrency(deliveryOption.priceCents)}`;

      const isChecked = deliveryOption.id === cartItem.deliveryOptionId;

      html += `
    <label class="delivery-option">
      <input
        type="radio"
        ${isChecked ? "checked" : ""}
        class="delivery-option-input js-delivery-option"
        name="delivery-option-${matchingProduct.id}"
        data-product-id="${matchingProduct.id}"
        data-delivery-option-id="${deliveryOption.id}"
      />
      <span class="delivery-option-date">${dateString}</span>
      <span class="delivery-option-price">${priceString}</span>
    </label>
    `;
    });
    return html;
  }

  document.querySelectorAll(".js-delivery-option").forEach((element) => {
    element.addEventListener("change", () => {
      const { productId, deliveryOptionId } = element.dataset;
      updateDeliveryOption(productId, deliveryOptionId);
      renderOrderSummary();
      renderPaymentSummary();
    });
  });
  const returnHomeLink = document.querySelector(".js-return-to-home-link");
  if (returnHomeLink) {
    returnHomeLink.textContent = `${cartQuantity} ${cartQuantity === 1 ? "item" : "items"}`;
  }
}

export default renderOrderSummary;

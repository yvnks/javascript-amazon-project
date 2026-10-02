import {
  cart,
  removeItemFromCart,
  updateDeliveryOption,
} from "../../data/cart.js";
import { products, getProduct } from "../../data/products.js";
import { formatCurrency } from "../utils/money.js";
import { addDays, formatDate } from "../utils/date.js";
import {
  deliveryOptions,
  getDeliveryOption,
} from "../../data/deliveryOptions.js";
import renderPaymentSummary from "./paymentSummary.js";

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
    <div class="cart-item-container js-cart-item-container-${matchingProduct.id} js-cart-item-container">
        <div class="delivery-date">Delivery date: ${dateString}</div>

        <div class="cart-item-details-grid">
            <img
            class="product-image"
            src="${matchingProduct.image}"
            />

            <div class="cart-item-details">
            <div class="product-name">
                ${matchingProduct.name}
            </div>
            <div class="product-price">${matchingProduct.getPrice()}</div>
            <div class="product-quantity js-product-quantity-${matchingProduct.id}">
                <span> Quantity: <span class="quantity-label">${cartItem.quantity}</span> </span>
                <span class="update-quantity-link link-primary">
                Update
                </span>
                <span class="delete-quantity-link link-primary 
                js-delete-quantity-link js-delete-link-${matchingProduct.id}"
                data-product-id=${matchingProduct.id}>
                Delete
                </span>
            </div>
            </div>

            <div class="delivery-options">
            <div class="delivery-options-title">
                Choose a delivery option:
            </div>
            ${deliveryOptionsHTML(matchingProduct, cartItem)}
            
           
            </div>
        </div>
    </div>
    `;
    document.querySelector(".js-order-summary").innerHTML = cartSummaryHTML;
  });
  document.querySelectorAll(".js-delete-quantity-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const { productId } = link.dataset;
      removeItemFromCart(productId);
      renderPaymentSummary();
      renderOrderSummary();
    });
  });

  function deliveryOptionsHTML(matchingProduct, cartItem) {
    let html = "";
    deliveryOptions.forEach((deliveryOption) => {
      const deliveryDate = addDays(new Date(), deliveryOption.deliveryDays);
      const dateString = formatDate(deliveryDate, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      const priceString =
        deliveryOption.priceCents === 0
          ? "FREE"
          : `$${formatCurrency(deliveryOption.priceCents)} -`;

      const isChecked = deliveryOption.id === cartItem.deliveryOptionId;

      html += `
    <div class="delivery-option js-delivery-option"
    data-product-id=${matchingProduct.id}
    data-delivery-option-id=${deliveryOption.id}
    >
                <input
                type="radio"
                ${isChecked ? "checked" : ""}
                class="delivery-option-input"
                name="delivery-option-${matchingProduct.id}"
                />
                <div>
                <div class="delivery-option-date">${dateString}</div>
                <div class="delivery-option-price">${priceString} Shipping</div>
                </div>
            </div>
    `;
    });
    return html;
  }

  document.querySelectorAll(".js-delivery-option").forEach((element) => {
    element.addEventListener("click", (e) => {
      const { productId, deliveryOptionId } = element.dataset;
      updateDeliveryOption(productId, deliveryOptionId);
      renderOrderSummary();
      renderPaymentSummary();
    });
  });
  const returnHomeLink = document.querySelector(".js-return-to-home-link");
  if (returnHomeLink) returnHomeLink.textContent = cartQuantity + " items";
}

export default renderOrderSummary;

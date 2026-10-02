import { cart, addToCart, loadCartForCurrentUser } from "../data/cart.js";
import { products, loadProductsFromFetch } from "../data/products.js";
import { formatCurrency } from "./utils/money.js";

function renderProductsGrid() {
  updateCartQuantity();
  let productsHtml = "";

  products.forEach((product) => {
    productsHtml += `
    <div class="product-container">
          <div class="product-image-container">
            <img class="product-image"
              src="${product.image}">
          </div>

          <div class="product-name limit-text-to-2-lines">
            ${product.name}
          </div>

          <div class="product-rating-container">
            <img class="product-rating-stars"
              src="${product.getStarsURL()}">
            <div class="product-rating-count link-primary">
              ${product.rating.count}
            </div>
          </div>

          <div class="product-price">
            ${product.getPrice()}
          </div>

          <div class="product-quantity-container">
            <select>
              <option selected value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>

           ${product.extraInfoHTML()}

          <div class="product-spacer"></div>

          <div class="added-to-cart">
            <img src="images/icons/checkmark.png">
            Added
          </div>

          <button class="add-to-cart-button 
          js-add-to-cart 
          button-primary"
          data-product-id=${product.id}>
          Add to Cart
          </button>
        </div>
    `;
    document.querySelector(".js-products-grid").innerHTML = productsHtml;
  });

  function updateCartQuantity() {
    // Make cart qty icon interactive
    let cartQty = 0;
    cart.forEach((cartItem) => {
      cartQty += cartItem.quantity;
    });
    document.querySelector(".js-cart-quantity").innerHTML = cartQty;
  }
  // Make add to cart button responsive.
  document.querySelectorAll(".js-add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const { productId } = button.dataset;
      addToCart(productId);
      updateCartQuantity();
    });
  });
}

Promise.all([loadProductsFromFetch(), loadCartForCurrentUser()])
  .then(() => {
    renderProductsGrid();
  })
  .catch((error) => {
    const grid = document.querySelector(".js-products-grid");
    grid.textContent = `Products could not be loaded: ${error.message}`;
  });

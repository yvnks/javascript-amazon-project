// The cart count appears in both the header and the mobile tab bar.
export function renderCartQuantity(cart) {
  const quantity = cart.reduce((total, item) => total + item.quantity, 0);

  document.querySelectorAll(".js-cart-quantity").forEach((element) => {
    element.textContent = quantity;
    element.hidden = quantity === 0;
  });
}

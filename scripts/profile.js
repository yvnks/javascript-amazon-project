import { getCurrentUser, getDisplayName } from "../data/auth.js";
import { requireSupabase } from "../lib/supabase.js";
import { formatDate } from "./utils/date.js";
import { cart, loadCartForCurrentUser } from "../data/cart.js";

async function renderProfile() {
  const errorMessage = document.querySelector("[data-profile-error]");

  try {
    const user = await getCurrentUser();

    if (!user) {
      window.location.href = "account.html";
      return;
    }

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

    try {
      await loadCartForCurrentUser();
      const cartQuantity = cart.reduce(
        (total, item) => total + item.quantity,
        0,
      );
      document.querySelector(".js-cart-quantity").textContent = cartQuantity;
    } catch (error) {
      console.error("Could not load cart count:", error.message);
    }
  } catch (error) {
    errorMessage.textContent = `Could not load your account details: ${error.message}`;
  }
}

renderProfile();

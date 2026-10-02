import { getCurrentUser, getDisplayName, logoutUser } from "../data/auth.js";
import { supabase, supabaseConfigured } from "../lib/supabase.js";

const LOGIN_PAGE = "account.html";

// Every signed-in page awaits this before loading its data, so nothing
// is fetched or shown until the session token has been verified.
export const currentUserReady = guardCurrentPage();

async function guardCurrentPage() {
  const currentUser = supabaseConfigured ? await getCurrentUser() : null;

  if (!currentUser) {
    window.location.replace(LOGIN_PAGE);
    // The page is being replaced; never let its data load.
    return new Promise(() => {});
  }

  const displayName = getDisplayName(currentUser);

  document.querySelectorAll(".js-user-name").forEach((element) => {
    element.textContent = `Hello, ${displayName}`;
    element.title = displayName;
  });

  document.querySelectorAll(".js-logout").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      await logoutUser();
      window.location.replace(LOGIN_PAGE);
    });
  });

  // Signing out in another tab removes the token there too, so follow it.
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.replace(LOGIN_PAGE);
  });

  document.documentElement.classList.remove("auth-pending");
  return currentUser;
}

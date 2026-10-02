import { getCurrentUser, getDisplayName } from "../data/auth.js";
import { supabaseConfigured } from "../lib/supabase.js";

const currentPage = window.location.pathname.split("/").pop() || "amazon.html";

async function guardCurrentPage() {
  if (currentPage === "account.html") return;

  const currentUser = await getCurrentUser();
  if (!supabaseConfigured || !currentUser) {
    window.location.href = "account.html";
    return;
  }

  const displayName = getDisplayName(currentUser);

  document.querySelectorAll(".js-user-name").forEach((element) => {
    element.textContent = `Hello, ${displayName}`;
    element.title = displayName;
  });
}

guardCurrentPage();

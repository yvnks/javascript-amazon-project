import { getCurrentUser } from "../data/auth.js";
import { supabaseConfigured } from "../lib/supabase.js";

const currentPage = window.location.pathname.split("/").pop() || "amazon.html";

async function guardCurrentPage() {
  if (currentPage === "account.html") return;

  const currentUser = await getCurrentUser();
  if (!supabaseConfigured || !currentUser) {
    window.location.href = "account.html";
  }
}

guardCurrentPage();

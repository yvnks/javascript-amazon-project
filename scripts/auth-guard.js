import { getCurrentUser } from "../data/auth.js";

const currentPage = window.location.pathname.split("/").pop() || "amazon.html";

if (currentPage !== "account.html" && !getCurrentUser()) {
  window.location.href = "account.html";
}

import {
  getCurrentUser,
  initializeGoogleAuth,
  loginWithEmail,
  logoutUser,
} from "../data/auth.js";
import { supabaseConfigured } from "../lib/supabase.js";

function showMessage(element, type, message) {
  if (!element) return;
  element.textContent = message;
  element.className = `auth-message auth-message-${type}`;
}

const loginForm = document.querySelector(".js-login-form");
const loginMessage = document.querySelector(".js-login-message");

if (!supabaseConfigured) {
  showMessage(
    loginMessage,
    "error",
    "Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env, then restart Vite.",
  );
}

if (loginForm) {
  const loginButton = loginForm.querySelector(".auth-button");
  const emailInput = loginForm.elements.email;
  const passwordInput = loginForm.elements.password;

  const updateLoginButton = () => {
    loginButton.disabled = !emailInput.value.trim();
  };

  loginForm.addEventListener("input", updateLoginButton);
  updateLoginButton();

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      await loginWithEmail({ email, password });
      window.location.href = "amazon.html";
    } catch (error) {
      showMessage(loginMessage, "error", error.message);
    }
  });
}

const googleButton = document.querySelector(".js-google-signin");
if (googleButton) {
  initializeGoogleAuth({
    container: googleButton,
    onError: (message) => {
      showMessage(
        document.querySelector(".js-google-message"),
        "error",
        message,
      );
    },
  });
}

const logoutButton = document.querySelector(".js-logout");
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await logoutUser();
      window.location.href = "account.html";
    } catch (error) {
      showMessage(loginMessage, "error", error.message);
    }
  });
}

getCurrentUser()
  .then((currentUser) => {
    if (currentUser) window.location.href = "amazon.html";
  })
  .catch((error) => {
    showMessage(loginMessage, "error", error.message);
  });

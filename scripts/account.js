import {
  getCurrentUser,
  initializeGoogleAuth,
  loginWithEmail,
  logoutUser,
} from "../data/auth.js";

const currentUser = getCurrentUser();

if (currentUser) {
  window.location.href = "amazon.html";
}

function showMessage(element, type, message) {
  if (!element) return;
  element.textContent = message;
  element.className = `auth-message auth-message-${type}`;
}

const loginForm = document.querySelector(".js-login-form");
const loginMessage = document.querySelector(".js-login-message");

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
    onSuccess: () => {
      window.location.href = "amazon.html";
    },
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
  logoutButton.addEventListener("click", () => {
    logoutUser();
    window.location.href = "account.html";
  });
}

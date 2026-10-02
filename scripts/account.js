import {
  getCurrentUser,
  initializeGoogleAuth,
  loginWithEmail,
  registerWithEmail,
  resendConfirmationEmail,
} from "../data/auth.js";
import { supabaseConfigured } from "../lib/supabase.js";

const SHOP_PAGE = "amazon.html";

function showMessage(element, type, message) {
  if (!element) return;
  element.textContent = message;
  element.className = `auth-message auth-message-${type}`;
}

function clearMessage(element) {
  element.textContent = "";
  element.className = "auth-message";
}

// Supabase's built-in mailer only delivers to the project team's own
// addresses and a few emails per hour; say so instead of failing silently.
function describeEmailError(error) {
  if (error.code === "email_address_not_authorized") {
    return "We couldn't send a confirmation email to that address yet. Please try again later or use Sign in with Google.";
  }
  if (error.code === "over_email_send_rate_limit") {
    return "Too many confirmation emails were sent recently. Please wait a few minutes and try again.";
  }
  return error.message;
}

// Adds a "Resend email" button under a message for an unconfirmed address.
function offerResend(element, email) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "auth-resend-button";
  button.textContent = "Resend confirmation email";

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await resendConfirmationEmail(email);
      showMessage(
        element,
        "success",
        `We sent a new link to ${email}. It can take a few minutes, so check Spam and Promotions too.`,
      );
    } catch (error) {
      showMessage(element, "error", describeEmailError(error));
      offerResend(element, email);
    }
  });

  element.append(document.createElement("br"), button);
}

const loginForm = document.querySelector(".js-login-form");
const loginMessage = document.querySelector(".js-login-message");
const registerForm = document.querySelector(".js-register-form");
const registerMessage = document.querySelector(".js-register-message");

if (!supabaseConfigured) {
  showMessage(
    loginMessage,
    "error",
    "Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env, then restart Vite.",
  );
}

// Sign in / Create account tabs.
const tabs = [...document.querySelectorAll(".js-auth-tab")];

function selectTab(selectedTab) {
  tabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden =
      !isSelected;
  });
  document.title = `${selectedTab.textContent.trim()} | Soma`;
  history.replaceState(
    null,
    "",
    selectedTab.dataset.panel === "register" ? "#register" : "#",
  );
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const nextTab = tabs[(index + 1) % tabs.length];
    selectTab(nextTab);
    nextTab.focus();
  });
});

if (window.location.hash === "#register") {
  selectTab(tabs.find((tab) => tab.dataset.panel === "register"));
}

// Keep each submit button disabled until its form is filled in.
function enableWhenFilled(form) {
  const button = form.querySelector(".auth-button");
  const inputs = [...form.querySelectorAll("input[required]")];
  const update = () => {
    button.disabled = inputs.some((input) => !input.value.trim());
  };
  form.addEventListener("input", update);
  update();
  return button;
}

const loginButton = enableWhenFilled(loginForm);
const registerButton = enableWhenFilled(registerForm);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(loginMessage);
  loginButton.disabled = true;

  try {
    await loginWithEmail({
      email: loginForm.email.value,
      password: loginForm.password.value,
    });
    window.location.replace(SHOP_PAGE);
  } catch (error) {
    loginButton.disabled = false;

    if (error.code === "email_not_confirmed") {
      showMessage(
        loginMessage,
        "error",
        "Confirm your email first. Open the link we sent to your Gmail inbox.",
      );
      offerResend(loginMessage, loginForm.email.value.trim());
      return;
    }

    showMessage(loginMessage, "error", error.message);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(registerMessage);
  registerButton.disabled = true;

  const email = registerForm.elements.namedItem("email").value.trim();

  try {
    const { session } = await registerWithEmail({
      name: registerForm.elements.namedItem("name").value,
      email,
      password: registerForm.elements.namedItem("password").value,
      confirmPassword: registerForm.elements.namedItem("confirmPassword").value,
    });

    if (session) {
      window.location.replace(SHOP_PAGE);
      return;
    }

    // Supabase is set to require email confirmation before first sign-in.
    showMessage(
      registerMessage,
      "success",
      `Account created. We sent a confirmation link to ${email}. Open it to finish signing up. Check Spam and Promotions if it isn't in your inbox.`,
    );
    offerResend(registerMessage, email);
    registerForm.reset();
  } catch (error) {
    showMessage(registerMessage, "error", describeEmailError(error));
    registerButton.disabled = false;
  }
});

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

// Already signed in: skip straight to the shop.
getCurrentUser()
  .then((currentUser) => {
    if (currentUser) window.location.replace(SHOP_PAGE);
  })
  .catch((error) => {
    showMessage(loginMessage, "error", error.message);
  });

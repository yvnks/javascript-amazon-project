import {
  requireSupabase,
  supabase,
  supabaseConfigured,
} from "../lib/supabase.js";
import { forgetStoredCarts } from "./cart.js";

const googleClientId = __GOOGLE_CLIENT_ID__?.trim();

function getGoogleButtonMarkup() {
  return `
    <button class="google-signin-button" type="button" aria-label="Sign in with Google">
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.22 3.61l6.85-6.85C35.97 2.36 30.72 0 24 0 14.64 0 6.57 5.38 2.56 13.22l7.98 6.19C12.97 13.39 17.93 9.5 24 9.5Z"/>
        <path fill="#4285F4" d="M46.53 24.55c0-1.65-.15-3.24-.43-4.77H24v9.02h12.73c-.55 2.96-2.2 5.47-4.7 7.17l7.6 5.9c4.42-4.07 7.9-10.07 7.9-17.32Z"/>
        <path fill="#FBBC05" d="M32.03 35.9c-2.06 1.38-4.7 2.2-8.03 2.2-6.07 0-11.2-4.09-13.02-9.6l-7.99 6.2C7.95 42.7 15.2 48 24 48c7.28 0 13.39-2.39 17.84-6.51l-9.81-5.59Z"/>
        <path fill="#34A853" d="M11.98 28.5A14.54 14.54 0 0 1 11.18 24c0-1.46.26-2.88.72-4.22L3.88 13.58A23.82 23.82 0 0 0 0 24c0 3.83.91 7.46 2.56 10.64l9.42-6.14Z"/>
      </svg>
      <span>Sign in with Google</span>
    </button>
  `;
}

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function isGmailAddress(email) {
  const normalized = normalizeEmail(email);
  return normalized.length > 0 && normalized.endsWith("@gmail.com");
}

export async function getCurrentUser() {
  if (!supabaseConfigured) return null;

  const { data, error } = await requireSupabase().auth.getUser();
  return error ? null : data.user;
}

export function getDisplayName(user) {
  const metadata = user?.user_metadata || {};
  return (
    [
      metadata.full_name,
      metadata.name,
      metadata.given_name,
      user?.email?.split("@")[0],
    ]
      .find((value) => typeof value === "string" && value.trim())
      ?.trim() || "Account"
  );
}

// Revokes the session token on the server and deletes it from this
// browser. If the server can't be reached, the local token is still
// removed so the user is signed out here either way.
export async function logoutUser() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) await client.auth.signOut({ scope: "local" });

  forgetStoredCarts();
}

export async function registerWithEmail({
  name,
  email,
  password,
  confirmPassword,
}) {
  const cleanedName = String(name || "").trim();
  const normalizedEmail = normalizeEmail(email);

  if (!cleanedName) {
    throw new Error("Your name is required.");
  }

  if (!isGmailAddress(normalizedEmail)) {
    throw new Error("Use a valid Gmail address to create an account.");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const { data, error } = await requireSupabase().auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: cleanedName },
      emailRedirectTo: getConfirmationRedirectUrl(),
    },
  });

  if (error) throw error;

  // Supabase answers a sign-up for an existing email with a fake user that
  // has no identities, and sends no email, so the address can't be probed.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error(
      "An account with this Gmail already exists. Sign in instead, or use Sign in with Google.",
    );
  }

  // session is null when the project requires email confirmation.
  return { user: data.user, session: data.session };
}

// The confirmation link brings the user back to the sign-in page, which
// picks the session up from the URL and continues to the shop.
function getConfirmationRedirectUrl() {
  return new URL("account.html", window.location.href).href;
}

export async function resendConfirmationEmail(email) {
  const { error } = await requireSupabase().auth.resend({
    type: "signup",
    email: normalizeEmail(email),
    options: { emailRedirectTo: getConfirmationRedirectUrl() },
  });

  if (error) throw error;
}

export async function loginWithEmail({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!isGmailAddress(normalizedEmail)) {
    throw new Error("Please enter a valid Gmail account.");
  }

  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) throw error;
  return data.user;
}

export function initializeGoogleAuth({ container, onError }) {
  if (!container) return false;

  container.innerHTML = getGoogleButtonMarkup();
  const fallbackButton = container.querySelector(".google-signin-button");

  if (!supabaseConfigured) {
    fallbackButton?.addEventListener("click", () => {
      onError?.("Configure Supabase before signing in with Google.");
    });
    return false;
  }

  if (!googleClientId) {
    fallbackButton?.addEventListener("click", () => {
      onError?.("Add GOOGLE_CLIENT_ID to .env before using Google sign-in.");
    });
    return false;
  }

  const googleScript = document.querySelector(
    'script[src="https://accounts.google.com/gsi/client"]',
  );
  const initializeButton = async () => {
    if (!window.google?.accounts?.id) {
      onError?.("Google Identity Services could not be loaded.");
      return;
    }

    const nonce = createNonce();
    const hashedNonce = await hashNonce(nonce);

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      nonce: hashedNonce,
      callback: async ({ credential }) => {
        try {
          const { error } = await requireSupabase().auth.signInWithIdToken({
            provider: "google",
            token: credential,
            nonce,
          });

          if (error) throw error;
          window.location.href = "amazon.html";
        } catch (error) {
          onError?.(error.message || "Google sign-in failed.");
        }
      },
    });

    container.replaceChildren();
    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      width: Math.floor(container.getBoundingClientRect().width),
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
    });
  };

  if (window.google?.accounts?.id) {
    initializeButton();
  } else if (googleScript) {
    googleScript.addEventListener("load", initializeButton, { once: true });
    googleScript.addEventListener(
      "error",
      () => onError?.("Google Identity Services could not be loaded."),
      { once: true },
    );
  }

  return true;
}

function createNonce() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashNonce(nonce) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(nonce),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

import { requireSupabase, supabaseConfigured } from "../lib/supabase.js";

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

export async function logoutUser() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
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
    options: { data: { name: cleanedName } },
  });

  if (error) throw error;
  return data.user;
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
  const button = container.querySelector(".google-signin-button");
  button?.addEventListener("click", async () => {
    try {
      const { error } = await requireSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("amazon.html", window.location.href).toString(),
        },
      });

      if (error) throw error;
    } catch (error) {
      onError?.(error.message || "Google sign-in could not be started.");
    }
  });

  return supabaseConfigured;
}

const USERS_KEY = "amazon-users";
const CURRENT_USER_KEY = "amazon-current-user";
export const GOOGLE_CLIENT_ID =
  "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

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

function getUsers() {
  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    return rawUsers ? JSON.parse(rawUsers) : [];
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  try {
    const currentUser = localStorage.getItem(CURRENT_USER_KEY);
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    return null;
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function hasGoogleClientConfig() {
  return (
    GOOGLE_CLIENT_ID &&
    GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
  );
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildUserSession(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider,
  };
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

  const users = getUsers();
  const existingUser = users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    throw new Error("An account with this Gmail already exists.");
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name: cleanedName,
    email: normalizedEmail,
    passwordHash,
    provider: "email",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const session = buildUserSession(newUser);
  setCurrentUser(session);
  return session;
}

export async function loginWithEmail({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!isGmailAddress(normalizedEmail)) {
    throw new Error("Please enter a valid Gmail account.");
  }

  const users = getUsers();
  const matchingUser = users.find((user) => user.email === normalizedEmail);

  if (!matchingUser) {
    throw new Error("No account found for this Gmail. Please sign up first.");
  }

  if (matchingUser.provider !== "email") {
    throw new Error(
      "This Gmail is connected to Google sign-in. Use Google login instead.",
    );
  }

  const passwordHash = await hashPassword(password);

  if (matchingUser.passwordHash !== passwordHash) {
    throw new Error("Incorrect password. Please try again.");
  }

  const session = buildUserSession(matchingUser);
  setCurrentUser(session);
  return session;
}

export async function loginWithGoogleCredential(credential) {
  if (!credential) {
    throw new Error("Google credential is missing.");
  }

  const payload = parseJwt(credential);
  const email = normalizeEmail(payload.email);

  if (!payload.email || !isGmailAddress(email)) {
    throw new Error("Google account must use a Gmail address.");
  }

  const users = getUsers();
  let existingUser = users.find((user) => user.email === email);

  if (!existingUser) {
    existingUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name: payload.name || "Google User",
      email,
      provider: "google",
      createdAt: new Date().toISOString(),
    };
    users.push(existingUser);
    saveUsers(users);
  }

  const session = buildUserSession(existingUser);
  setCurrentUser(session);
  return session;
}

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  if (!base64Url) {
    throw new Error("Invalid Google token.");
  }

  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const decoded = atob(padded);
  const decodedJson = decodeURIComponent(
    Array.from(decoded)
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(""),
  );

  return JSON.parse(decodedJson);
}

export function initializeGoogleAuth({ container, onSuccess, onError }) {
  if (!hasGoogleClientConfig()) {
    if (container) {
      container.innerHTML = getGoogleButtonMarkup();
      const fallbackButton = container.querySelector(".google-signin-button");
      fallbackButton?.addEventListener("click", () => {
        onError?.("Add your Google client ID to enable Google sign-in.");
      });
    }
    return false;
  }

  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    if (container) {
      container.innerHTML = getGoogleButtonMarkup();
      const loadingButton = container.querySelector(".google-signin-button");
      if (loadingButton) {
        loadingButton.disabled = true;
        loadingButton.querySelector("span").textContent = "Loading Google...";
      }
    }
    return false;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        const user = await loginWithGoogleCredential(response.credential);
        onSuccess?.(user);
      } catch (error) {
        onError?.(error.message || "Google sign-in failed.");
      }
    },
  });

  if (container) {
    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "signin_with",
      logo_alignment: "left",
    });
  }

  return true;
}

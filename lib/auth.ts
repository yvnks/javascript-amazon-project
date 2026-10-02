import type { User } from "@supabase/supabase-js";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isGmailAddress(email: string) {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@gmail\.com$/.test(normalized);
}

export function getDisplayName(user: User | null | undefined) {
  const metadata = user?.user_metadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.given_name,
    user?.email?.split("@")[0],
  ];
  const name = candidates.find(
    (value): value is string => typeof value === "string" && !!value.trim(),
  );
  return name?.trim() || "Account";
}

export function getSignInMethod(user: User) {
  const provider = user.app_metadata?.provider || "email";
  return provider === "google" ? "Google" : provider[0].toUpperCase() + provider.slice(1);
}

export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// Returns an error message, or null when the details are acceptable.
export function validateRegistration(input: RegistrationInput) {
  if (!input.name.trim()) return "Your name is required.";
  if (!isGmailAddress(input.email)) {
    return "Use a valid Gmail address to create an account.";
  }
  if (input.password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (input.password !== input.confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}

// Supabase's built-in mailer only delivers to the project team's own
// addresses and a few emails per hour; say so instead of failing silently.
export function describeAuthError(error: { code?: string; message: string }) {
  switch (error.code) {
    case "email_address_not_authorized":
      return "We couldn't send a confirmation email to that address yet. Please try again later or use Sign in with Google.";
    case "over_email_send_rate_limit":
      return "Too many confirmation emails were sent recently. Please wait a few minutes and try again.";
    case "invalid_credentials":
      return "That email and password don't match an account.";
    default:
      return error.message;
  }
}

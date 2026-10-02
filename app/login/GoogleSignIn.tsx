"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { googleClientId, supabaseConfigured } from "@/lib/supabase/config";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        nonce: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Google signs a hash of the nonce; Supabase checks it against the raw one.
async function createNonce() {
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  return { nonce, hashedNonce: toHex(new Uint8Array(digest)) };
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.22 3.61l6.85-6.85C35.97 2.36 30.72 0 24 0 14.64 0 6.57 5.38 2.56 13.22l7.98 6.19C12.97 13.39 17.93 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.53 24.55c0-1.65-.15-3.24-.43-4.77H24v9.02h12.73c-.55 2.96-2.2 5.47-4.7 7.17l7.6 5.9c4.42-4.07 7.9-10.07 7.9-17.32Z" />
      <path fill="#FBBC05" d="M32.03 35.9c-2.06 1.38-4.7 2.2-8.03 2.2-6.07 0-11.2-4.09-13.02-9.6l-7.99 6.2C7.95 42.7 15.2 48 24 48c7.28 0 13.39-2.39 17.84-6.51l-9.81-5.59Z" />
      <path fill="#34A853" d="M11.98 28.5A14.54 14.54 0 0 1 11.18 24c0-1.46.26-2.88.72-4.22L3.88 13.58A23.82 23.82 0 0 0 0 24c0 3.83.91 7.46 2.56 10.64l9.42-6.14Z" />
    </svg>
  );
}

export function GoogleSignIn() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = supabaseConfigured && Boolean(googleClientId);

  const renderButton = useCallback(async () => {
    const container = containerRef.current;
    if (!container || !window.google?.accounts?.id) return;

    const { nonce, hashedNonce } = await createNonce();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      nonce: hashedNonce,
      callback: async ({ credential }) => {
        const { error } = await createClient().auth.signInWithIdToken({
          provider: "google",
          token: credential,
          nonce,
        });
        if (error) {
          setError(error.message || "Google sign-in failed.");
          return;
        }
        router.replace("/shop");
        router.refresh();
      },
    });

    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      // The container is still hidden here, so measure its wrapper.
      width: Math.floor((container.parentElement ?? container).getBoundingClientRect().width),
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
    });
    setReady(true);
  }, [router]);

  // The script may already be loaded when returning to this page.
  useEffect(() => {
    if (enabled && window.google?.accounts?.id) renderButton();
  }, [enabled, renderButton]);

  function explainUnavailable() {
    setError(
      supabaseConfigured
        ? "Add GOOGLE_CLIENT_ID to .env before using Google sign-in."
        : "Configure Supabase before signing in with Google.",
    );
  }

  return (
    <div className="auth-google-wrap">
      {enabled && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => void renderButton()}
          onError={() => setError("Google sign-in could not be loaded.")}
        />
      )}
      <div id="google-signin-button" ref={containerRef} hidden={!ready} />
      {!ready && (
        <button
          className="google-signin-button"
          type="button"
          onClick={enabled ? undefined : explainUnavailable}
          aria-disabled={enabled}
        >
          <GoogleMark />
          <span>Sign in with Google</span>
        </button>
      )}
      {error && (
        <div className="auth-message auth-message-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

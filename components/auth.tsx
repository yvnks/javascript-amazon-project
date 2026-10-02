"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BROWSER_CART_PREFIX } from "./CartProvider";
import { SignOutIcon } from "./icons";

function forgetBrowserCarts() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(BROWSER_CART_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

// Signing out revokes the session on Supabase and deletes the session
// cookies, so the token can't be reused in this or any other browser.
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    // If Supabase can't be reached, still remove the token locally.
    if (error) await supabase.auth.signOut({ scope: "local" });
    forgetBrowserCarts();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="button-secondary sign-out-button"
      type="button"
      onClick={signOut}
      disabled={pending}
    >
      <SignOutIcon />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

// Signing out in another tab ends the session here too.
export function SignedOutRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        forgetBrowserCarts();
        router.replace("/login");
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  return null;
}

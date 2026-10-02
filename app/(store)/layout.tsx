import { redirect } from "next/navigation";
import { SignedOutRedirect } from "@/components/auth";
import { CartProvider } from "@/components/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { TabBar } from "@/components/TabBar";
import { getDisplayName } from "@/lib/auth";
import { getCart } from "@/lib/data/cart";
import { getCurrentUser } from "@/lib/supabase/server";

// Every store page renders inside this layout, which only runs for a
// verified session. proxy.ts redirects earlier; this is the backstop.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cart = await getCart();

  return (
    <CartProvider userId={user.id} initialItems={cart.items} storage={cart.storage}>
      <SignedOutRedirect />
      <SiteHeader userName={getDisplayName(user)} />
      {children}
      <TabBar />
    </CartProvider>
  );
}

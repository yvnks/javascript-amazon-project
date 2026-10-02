"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { BagIcon, BoxIcon, HomeIcon, SearchIcon, UserIcon } from "./icons";
import { CartCount, SEARCH_INPUT_ID } from "./SiteHeader";

// Bottom navigation on phones. The header carries the same links on
// wider screens, where this is hidden by CSS.
export function TabBar() {
  const pathname = usePathname();
  const { count } = useCart();

  const current = (match: boolean) => (match ? "page" : undefined);

  return (
    <nav className="tab-bar" aria-label="Primary">
      <Link className="tab-link" href="/shop" aria-current={current(pathname === "/shop")}>
        <HomeIcon />
        <span>Home</span>
      </Link>
      <Link
        className="tab-link"
        href="/shop#search"
        onClick={(event) => {
          const input = document.getElementById(SEARCH_INPUT_ID);
          if (pathname === "/shop" && input) {
            event.preventDefault();
            input.focus();
          }
        }}
      >
        <SearchIcon />
        <span>Search</span>
      </Link>
      <Link
        className="tab-cart"
        href="/cart"
        aria-label={count ? `Cart, ${count} items` : "Cart"}
        aria-current={current(pathname === "/cart")}
      >
        <BagIcon />
        <CartCount count={count} />
      </Link>
      <Link
        className="tab-link"
        href="/orders"
        aria-current={current(pathname.startsWith("/orders"))}
      >
        <BoxIcon />
        <span>Orders</span>
      </Link>
      <Link className="tab-link" href="/account" aria-current={current(pathname === "/account")}>
        <UserIcon />
        <span>Account</span>
      </Link>
    </nav>
  );
}

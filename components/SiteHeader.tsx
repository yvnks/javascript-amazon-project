"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { BagIcon, BoxIcon, SearchIcon, UserIcon } from "./icons";

export const SEARCH_INPUT_ID = "site-search";

// Search only exists on the shop page. It keeps the query in the URL
// (?search=…) so the product grid, refreshes and shared links agree.
function ShopSearch() {
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = searchParams.get("search") ?? "";

  useEffect(() => {
    if (window.location.hash === "#search") inputRef.current?.focus();
  }, []);

  // replaceState updates useSearchParams without a server round trip,
  // so the grid filters as you type.
  function updateQuery(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set("search", value);
    else params.delete("search");
    const search = params.toString();
    window.history.replaceState(null, "", search ? `/shop?${search}` : "/shop");
  }

  return (
    <form
      className="site-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        inputRef.current?.blur();
      }}
    >
      <SearchIcon />
      <input
        ref={inputRef}
        id={SEARCH_INPUT_ID}
        className="search-bar"
        type="search"
        name="search"
        placeholder="Search products"
        aria-label="Search products"
        defaultValue={query}
        onChange={(event) => updateQuery(event.target.value)}
      />
    </form>
  );
}

export function CartCount({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="cart-quantity" aria-hidden="true">
      {count}
    </span>
  );
}

export function SiteHeader({ userName }: { userName: string }) {
  const pathname = usePathname();
  const { count } = useCart();
  const cartLabel = count ? `Cart, ${count} items` : "Cart";

  return (
    <header className="site-header">
      <Link className="site-logo" href="/shop">
        Soma
      </Link>

      {pathname === "/shop" && (
        <Suspense fallback={<div className="site-search" />}>
          <ShopSearch />
        </Suspense>
      )}

      <nav className="site-header-actions" aria-label="Account">
        <Link
          className="header-account"
          href="/account"
          aria-current={pathname === "/account" ? "page" : undefined}
          title={userName}
        >
          <UserIcon />
          <span className="header-account-name">Hello, {userName}</span>
        </Link>
        <Link
          className="icon-button"
          href="/orders"
          aria-label="Orders"
          aria-current={pathname.startsWith("/orders") ? "page" : undefined}
        >
          <BoxIcon />
        </Link>
        {pathname !== "/cart" && (
          <Link className="icon-button cart-link" href="/cart" aria-label={cartLabel}>
            <BagIcon />
            <CartCount count={count} />
          </Link>
        )}
      </nav>
    </header>
  );
}

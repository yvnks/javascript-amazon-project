"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { RepeatIcon } from "@/components/icons";

export function BuyAgainButton({ productId, productName }: { productId: string; productName: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  return (
    <button
      className={`buy-again-button button-primary${added ? " is-added" : ""}`}
      type="button"
      aria-label={added ? `Added ${productName} to your cart` : `Buy ${productName} again`}
      onClick={() => {
        addItem(productId);
        setAdded(true);
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setAdded(false), 2000);
      }}
    >
      <RepeatIcon />
      <span className="buy-again-message">
        {added ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="added-check" src="/images/icons/checkmark.png" alt="" /> Added
          </>
        ) : (
          "Buy it again"
        )}
      </span>
    </button>
  );
}

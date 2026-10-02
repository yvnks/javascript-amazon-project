"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { PageHeading } from "@/components/PageHeading";
import { MAX_QUANTITY, summarizeCart } from "@/lib/cart";
import { deliveryOptions, getDeliveryOption } from "@/lib/delivery";
import { addDays, formatDate, formatMoney, pluralize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Product } from "@/lib/types";

// Delivery dates depend on today's date in the visitor's time zone, which
// can differ from the server's, so React is told not to flag the text.
function DeliveryDate({ days, options }: { days: number; options: Intl.DateTimeFormatOptions }) {
  return <span suppressHydrationWarning>{formatDate(addDays(new Date(), days), options)}</span>;
}

function CartRow({ item, product }: { item: CartItem; product: Product }) {
  const { removeItem, setQuantity, setDeliveryOption } = useCart();
  const option = getDeliveryOption(item.deliveryOptionId);

  return (
    <div className="cart-item-container card">
      <div className="cart-item-details-grid">
        <div className="cart-item-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="product-image" src={product.image} alt="" />
        </div>
        <div className="cart-item-details">
          <div className="product-name limit-text-to-2-lines">{product.name}</div>
          <div className="delivery-date">
            Arrives{" "}
            <DeliveryDate days={option.deliveryDays} options={{ weekday: "long", month: "long", day: "numeric" }} />
          </div>
          <div className="product-price">{formatMoney(product.priceCents)}</div>
        </div>
      </div>

      <div className="cart-item-actions">
        <div className="cart-item-subtotal">{formatMoney(product.priceCents * item.quantity)}</div>

        <button
          className="delete-quantity-link"
          type="button"
          aria-label={`Remove ${product.name}`}
          onClick={() => removeItem(product.id)}
        >
          <TrashIcon />
        </button>

        <div className="quantity-stepper">
          <button
            type="button"
            aria-label={`Decrease quantity of ${product.name}`}
            disabled={item.quantity <= 1}
            onClick={() => setQuantity(product.id, item.quantity - 1)}
          >
            <MinusIcon />
          </button>
          <span className="quantity-label" aria-live="polite">
            <span className="visually-hidden">Quantity: </span>
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity of ${product.name}`}
            disabled={item.quantity >= MAX_QUANTITY}
            onClick={() => setQuantity(product.id, item.quantity + 1)}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <div className="delivery-options-title" id={`delivery-${product.id}`}>
        Choose a delivery option
      </div>
      <div className="delivery-options" role="radiogroup" aria-labelledby={`delivery-${product.id}`}>
        {deliveryOptions.map((delivery) => (
          <label className="delivery-option" key={delivery.id}>
            <input
              type="radio"
              className="delivery-option-input"
              name={`delivery-option-${product.id}`}
              checked={delivery.id === item.deliveryOptionId}
              onChange={() => setDeliveryOption(product.id, delivery.id)}
            />
            <span className="delivery-option-date">
              <DeliveryDate days={delivery.deliveryDays} options={{ weekday: "short", month: "short", day: "numeric" }} />
            </span>
            <span className="delivery-option-price">
              {delivery.priceCents ? formatMoney(delivery.priceCents) : "Free"}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PaymentSummary({ items, productsById }: { items: CartItem[]; productsById: Map<string, Product> }) {
  const router = useRouter();
  const cart = useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summary = summarizeCart(items, productsById);

  async function placeOrder() {
    setPlacing(true);
    setError(null);

    try {
      // Make sure every cart change has reached Supabase first: the order
      // is built on the server from the saved cart.
      await cart.flush();
      const { error } = await createClient().rpc("place_order_from_cart");
      if (error) throw error;
      cart.clear();
      router.push("/orders");
      router.refresh();
    } catch (error) {
      setError((error as Error).message || "Could not place your order. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <div className="payment-summary card">
      <div className="payment-summary-title">Order Summary</div>
      <div className="payment-summary-row">
        <div>Items ({summary.itemCount})</div>
        <div className="payment-summary-money">{formatMoney(summary.itemsCents)}</div>
      </div>
      <div className="payment-summary-row">
        <div>Shipping &amp; handling</div>
        <div className="payment-summary-money">{formatMoney(summary.shippingCents)}</div>
      </div>
      <div className="payment-summary-row subtotal-row">
        <div>Total before tax</div>
        <div className="payment-summary-money">{formatMoney(summary.beforeTaxCents)}</div>
      </div>
      <div className="payment-summary-row">
        <div>Estimated tax (10%)</div>
        <div className="payment-summary-money">{formatMoney(summary.taxCents)}</div>
      </div>
      <div className="payment-summary-row total-row">
        <div>Total</div>
        <div className="payment-summary-money">{formatMoney(summary.totalCents)}</div>
      </div>

      {(error || cart.syncError) && (
        <p className="place-order-message" role="alert">
          {error ?? cart.syncError}
        </p>
      )}
      <button
        className="place-order-button button-primary"
        type="button"
        disabled={placing || items.length === 0}
        onClick={placeOrder}
      >
        {placing ? "Placing order…" : "Place your order"}
      </button>
    </div>
  );
}

export function CartView({ products }: { products: Product[] }) {
  const { items, count } = useCart();
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  // Skip items whose product is no longer in the catalog.
  const rows = items.filter((item) => productsById.has(item.productId));

  return (
    <main className="main page-cart">
      <PageHeading title="My cart" back={{ href: "/shop", label: "Back to shop" }}>
        {" "}
        <span className="page-title-count">({pluralize(count, "item", "items")})</span>
      </PageHeading>

      <div className="checkout-grid">
        <div className="order-summary">
          {rows.length ? (
            rows.map((item) => (
              <CartRow key={item.productId} item={item} product={productsById.get(item.productId)!} />
            ))
          ) : (
            <div className="empty-cart card">
              <p className="empty-cart-title">Your cart is empty</p>
              <p className="empty-cart-text">Items you add will show up here.</p>
              <Link className="button-primary" href="/shop">
                Continue shopping
              </Link>
            </div>
          )}
        </div>

        <PaymentSummary items={rows} productsById={productsById} />
      </div>
    </main>
  );
}

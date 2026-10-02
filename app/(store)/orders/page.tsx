import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { getOrders, OrdersUnavailableError } from "@/lib/data/orders";
import { capitalize, formatMoney, formatStoredDate } from "@/lib/format";
import { trackingHref } from "@/lib/links";
import type { Order } from "@/lib/types";
import { BuyAgainButton } from "./BuyAgainButton";
import "../../styles/orders.css";

export const metadata: Metadata = { title: "Your orders" };

function OrderCard({ order }: { order: Order }) {
  return (
    <section className="order-card card">
      <div className="order-header">
        <div className="order-header-item">
          <div className="order-header-label">Order placed</div>
          <div>{formatStoredDate(order.createdAt, { month: "long", day: "numeric" })}</div>
        </div>
        <div className="order-header-item">
          <div className="order-header-label">Total</div>
          <div>{formatMoney(order.totalCents)}</div>
        </div>
        <div className="order-header-item order-id">
          <div className="order-header-label">Order ID</div>
          <div>{order.id}</div>
        </div>
        <span className="order-status">{capitalize(order.status)}</span>
      </div>

      {order.items.map((item) => (
        <div className="order-details-grid" key={item.productId}>
          <div className="product-image-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt="" />
          </div>
          <div className="product-details">
            <div className="product-name limit-text-to-2-lines">{item.name}</div>
            <div className="product-delivery-date">
              Arriving{" "}
              {formatStoredDate(item.estimatedDeliveryDate, { weekday: "short", month: "long", day: "numeric" })}
            </div>
            <div className="product-quantity">Quantity: {item.quantity}</div>
          </div>
          <div className="product-actions">
            <BuyAgainButton productId={item.productId} productName={item.name} />
            <Link className="track-package-button button-secondary" href={trackingHref(order.id, item.productId)}>
              Track package
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}

export default async function OrdersPage() {
  let orders: Order[] = [];
  let problem: string | null = null;

  try {
    orders = await getOrders();
  } catch (error) {
    problem =
      error instanceof OrdersUnavailableError
        ? error.message
        : `Could not load orders: ${(error as Error).message}`;
  }

  return (
    <main className="main page-orders">
      <PageHeading title="Your orders" back={{ href: "/shop", label: "Back to shop" }} />

      <div className="order-container">
        {problem ? (
          <p className="status-message">{problem}</p>
        ) : orders.length ? (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <div className="empty-orders card">
            <p className="empty-orders-title">No orders yet</p>
            <p className="empty-orders-text">When you place an order it will show up here.</p>
            <Link className="button-primary" href="/shop">
              Start shopping
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

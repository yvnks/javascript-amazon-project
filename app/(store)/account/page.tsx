import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth";
import { UserIcon } from "@/components/icons";
import { PageHeading } from "@/components/PageHeading";
import { getDisplayName, getSignInMethod } from "@/lib/auth";
import { getOrders, OrdersUnavailableError } from "@/lib/data/orders";
import { capitalize, formatMoney, formatStoredDate } from "@/lib/format";
import { trackingHref } from "@/lib/links";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import "../../styles/account.css";

export const metadata: Metadata = { title: "Account" };

const HISTORY_LIMIT = 5;

function PurchaseHistory({ orders }: { orders: Order[] }) {
  const items = orders.flatMap((order) => order.items.map((item) => ({ item, order })));
  const itemCount = items.reduce((total, { item }) => total + item.quantity, 0);
  const spentCents = orders.reduce((total, order) => total + order.totalCents, 0);

  return (
    <>
      <div className="history-stats">
        <div className="history-stat">
          <span className="history-stat-value">{orders.length}</span>
          <span className="history-stat-label">{orders.length === 1 ? "Order" : "Orders"}</span>
        </div>
        <div className="history-stat">
          <span className="history-stat-value">{itemCount}</span>
          <span className="history-stat-label">{itemCount === 1 ? "Item" : "Items"}</span>
        </div>
        <div className="history-stat">
          <span className="history-stat-value">{formatMoney(spentCents)}</span>
          <span className="history-stat-label">Spent</span>
        </div>
      </div>

      {items.length ? (
        <ul className="history-list">
          {items.slice(0, HISTORY_LIMIT).map(({ item, order }) => (
            <li className="history-item" key={`${order.id}-${item.productId}`}>
              <div className="history-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" />
              </div>
              <div className="history-details">
                <div className="history-name limit-text-to-2-lines">{item.name}</div>
                <div className="history-meta">
                  Ordered {formatStoredDate(order.createdAt, { month: "short", day: "numeric", year: "numeric" })} · Qty{" "}
                  {item.quantity}
                </div>
              </div>
              <Link
                className="history-track"
                href={trackingHref(order.id, item.productId)}
                aria-label={`${capitalize(order.status)}: track ${item.name}`}
              >
                {capitalize(order.status)}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="history-empty">
          You haven&apos;t bought anything yet. Your purchases will show up here.
        </p>
      )}
    </>
  );
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let orders: Order[] | null = null;
  let historyProblem: string | null = null;
  try {
    orders = await getOrders();
  } catch (error) {
    historyProblem =
      error instanceof OrdersUnavailableError
        ? error.message
        : `Could not load your purchase history: ${(error as Error).message}`;
  }

  return (
    <main className="main page-account">
      <PageHeading title="Account" back={{ href: "/shop", label: "Back to shop" }} />

      <section className="profile-card card">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">
            <UserIcon />
          </div>
          <div>
            <p className="profile-name">{getDisplayName(user)}</p>
            <p className="profile-intro">Your signed-in account information.</p>
          </div>
        </div>

        <dl className="profile-details">
          <div className="profile-detail-row">
            <dt>Email</dt>
            <dd>{user.email || "Not available"}</dd>
          </div>
          <div className="profile-detail-row">
            <dt>Sign-in method</dt>
            <dd>{getSignInMethod(user)}</dd>
          </div>
          <div className="profile-detail-row">
            <dt>Member since</dt>
            <dd>
              {user.created_at
                ? formatStoredDate(user.created_at, { month: "long", day: "numeric", year: "numeric" })
                : "Not available"}
            </dd>
          </div>
        </dl>

        <div className="profile-actions">
          <Link className="button-primary" href="/shop">
            Continue shopping
          </Link>
          <SignOutButton />
        </div>
      </section>

      <section className="history-card card" aria-labelledby="history-title">
        <div className="history-header">
          <h2 className="history-title" id="history-title">
            Purchase history
          </h2>
          <Link className="link-primary" href="/orders">
            View all orders
          </Link>
        </div>

        {orders ? <PurchaseHistory orders={orders} /> : <p className="history-empty">{historyProblem}</p>}
      </section>
    </main>
  );
}

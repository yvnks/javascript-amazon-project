import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { getOrder, OrdersUnavailableError } from "@/lib/data/orders";
import { formatStoredDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import "../../../../../styles/tracking.css";

export const metadata: Metadata = { title: "Track package" };

const STEPS: { status: OrderStatus; label: string; progress: number }[] = [
  { status: "preparing", label: "Preparing", progress: 20 },
  { status: "shipped", label: "Shipped", progress: 60 },
  { status: "delivered", label: "Delivered", progress: 100 },
];

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ orderId: string; productId: string }>;
}) {
  const { orderId, productId } = await params;

  let order;
  try {
    order = await getOrder(decodeURIComponent(orderId));
  } catch (error) {
    if (!(error instanceof OrdersUnavailableError)) throw error;
    return (
      <main className="main page-tracking">
        <PageHeading title="Track package" back={{ href: "/orders", label: "Back to orders" }} />
        <p className="status-message">{error.message}</p>
      </main>
    );
  }

  const item = order?.items.find((entry) => entry.productId === decodeURIComponent(productId));
  if (!order || !item) notFound();

  const currentStep = Math.max(0, STEPS.findIndex((step) => step.status === order.status));

  return (
    <main className="main page-tracking">
      <PageHeading title="Track package" back={{ href: "/orders", label: "Back to orders" }} />

      <Link className="back-to-orders-link link-primary" href="/orders">
        View all orders
      </Link>

      <div className="tracking-card card">
        <div className="tracking-product">
          <div className="product-image-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="product-image" src={item.image} alt="" />
          </div>
          <div>
            <div className="delivery-date">
              Arriving on{" "}
              {formatStoredDate(item.estimatedDeliveryDate, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="product-info product-name">{item.name}</div>
            <div className="product-info">Quantity: {item.quantity}</div>
          </div>
        </div>

        <ol className="progress-labels-container" aria-label="Delivery progress">
          {STEPS.map((step, index) => (
            <li
              key={step.status}
              className={[
                "progress-label",
                index <= currentStep ? "is-complete" : "",
                index === currentStep ? "current-status" : "",
              ].join(" ").trim()}
              aria-current={index === currentStep ? "step" : undefined}
            >
              {step.label}
            </li>
          ))}
        </ol>

        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${STEPS[currentStep].progress}%` }} />
        </div>
      </div>
    </main>
  );
}

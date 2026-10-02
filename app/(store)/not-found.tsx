import Link from "next/link";

export default function NotFound() {
  return (
    <main className="main">
      <div className="card status-message">
        <p>We couldn&apos;t find that page or order item.</p>
        <p style={{ marginTop: 16 }}>
          <Link className="button-primary" href="/orders">
            View your orders
          </Link>
        </p>
      </div>
    </main>
  );
}

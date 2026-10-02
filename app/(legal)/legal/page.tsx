import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms & Privacy" };

// A generic starting point. Review it before relying on it for a real store.
export default function LegalPage() {
  return (
    <article className="legal-card card">
      <h1 className="legal-title">Terms &amp; Privacy</h1>
      <p className="legal-updated">Last updated October 2, 2026</p>

      <section id="terms" aria-labelledby="terms-title">
        <h2 id="terms-title">Terms of Service</h2>
        <p>
          By creating an account or placing an order with Soma, you agree to use the store lawfully and
          to keep your account details secure. You are responsible for orders placed from your
          account. Prices, product details and delivery estimates may change, and we will contact you
          if there is a problem with your order. We may update these terms from time to time.
        </p>
      </section>

      <section id="privacy" aria-labelledby="privacy-title">
        <h2 id="privacy-title">Privacy Policy</h2>
        <p>
          We collect the information needed to run your account and orders, such as your name, email
          address, cart and order history. We use it to sign you in, process orders and send related
          emails. We don&apos;t sell your information. It is shared only with the service providers
          that host the store, handle sign-in and deliver emails. Contact us to correct or delete
          your information.
        </p>
      </section>

      <section id="cookies" aria-labelledby="cookies-title">
        <h2 id="cookies-title">Cookie Use</h2>
        <p>
          We use only the cookies needed to keep you signed in, and browser storage to remember your
          cart. We don&apos;t use advertising or tracking cookies. Blocking cookies will stop you from
          staying signed in.
        </p>
      </section>

      <p className="legal-back">
        <Link className="link-primary" href="/login">
          Back to sign in
        </Link>
      </p>
    </article>
  );
}

import Link from "next/link";
import "../styles/legal.css";

// The legal page is public: people read it before signing in.
// proxy.ts lists /legal as a public path.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-legal">
      <header className="legal-header">
        <Link className="site-logo" href="/login">
          Soma
        </Link>
      </header>
      <main className="legal-main">{children}</main>
    </div>
  );
}

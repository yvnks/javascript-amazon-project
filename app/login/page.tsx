import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { GradientBackground } from "./GradientBackground";
import { LoginForm } from "./LoginForm";
import "../styles/login.css";

export const metadata: Metadata = { title: "Sign in" };

const CALLBACK_ERRORS: Record<string, string> = {
  confirm:
    "That confirmation link didn't work. It may have expired or been opened in a different browser. Sign in, or ask for a new link.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/shop");
  const { error } = await searchParams;

  return (
    <div className="page-login">
      <GradientBackground />
      <main className="auth-page">
        <LoginForm
          configured={supabaseConfigured}
          initialError={error ? CALLBACK_ERRORS[error] ?? null : null}
        />
      </main>
    </div>
  );
}

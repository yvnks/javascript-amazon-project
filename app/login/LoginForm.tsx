"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  describeAuthError,
  isGmailAddress,
  normalizeEmail,
  validateRegistration,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignIn } from "./GoogleSignIn";

type Panel = "login" | "register";
type Message = { type: "error" | "success"; text: string; resendTo?: string };

function confirmationRedirectUrl() {
  return new URL("/auth/callback", window.location.origin).href;
}

function MessageBox({ message }: { message: Message | null }) {
  const [resend, setResend] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => setResend(null), [message]);

  const shown = resend ?? message;
  if (!shown) return null;

  async function resendEmail(email: string) {
    setSending(true);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: confirmationRedirectUrl() },
    });
    setSending(false);
    setResend(
      error
        ? { type: "error", text: describeAuthError(error), resendTo: email }
        : {
            type: "success",
            text: `We sent a new link to ${email}. It can take a few minutes, so check Spam and Promotions too.`,
          },
    );
  }

  return (
    <div className={`auth-message auth-message-${shown.type}`} role="alert">
      {shown.text}
      {shown.resendTo && (
        <>
          <br />
          <button
            className="auth-resend-button"
            type="button"
            disabled={sending}
            onClick={() => resendEmail(shown.resendTo!)}
          >
            Resend confirmation email
          </button>
        </>
      )}
    </div>
  );
}

function SignInPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!isGmailAddress(email)) {
      setMessage({ type: "error", text: "Please enter a valid Gmail address." });
      return;
    }

    setPending(true);
    const { error } = await createClient().auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (!error) {
      router.replace("/shop");
      router.refresh();
      return;
    }

    setPending(false);
    setMessage(
      error.code === "email_not_confirmed"
        ? {
            type: "error",
            text: "Confirm your email first. Open the link we sent to your Gmail inbox.",
            resendTo: normalizeEmail(email),
          }
        : { type: "error", text: describeAuthError(error) },
    );
  }

  return (
    <form onSubmit={signIn} noValidate>
      <label>
        <span>Gmail address</span>
        <input
          type="email"
          name="email"
          placeholder="you@gmail.com"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        <span>Password</span>
        <input
          type="password"
          name="password"
          placeholder="Your password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <MessageBox message={message} />
      <button
        className="auth-button button-primary"
        type="submit"
        disabled={pending || !email.trim() || !password}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

const emptyRegistration = { name: "", email: "", password: "", confirmPassword: "" };

function RegisterPanel() {
  const router = useRouter();
  const [fields, setFields] = useState(emptyRegistration);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const update = (name: keyof typeof fields) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setFields((current) => ({ ...current, [name]: event.target.value }));

  async function register(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const invalid = validateRegistration(fields);
    if (invalid) {
      setMessage({ type: "error", text: invalid });
      return;
    }

    setPending(true);
    const email = normalizeEmail(fields.email);
    const { data, error } = await createClient().auth.signUp({
      email,
      password: fields.password,
      options: {
        data: { name: fields.name.trim() },
        emailRedirectTo: confirmationRedirectUrl(),
      },
    });
    setPending(false);

    if (error) {
      setMessage({ type: "error", text: describeAuthError(error) });
      return;
    }

    // For an email that's already registered, Supabase returns a user
    // with no identities and sends nothing, so addresses can't be probed.
    if (data.user && data.user.identities?.length === 0) {
      setMessage({
        type: "error",
        text: "An account with this Gmail already exists. Sign in instead, or use Sign in with Google.",
      });
      return;
    }

    // No session means the project requires email confirmation first.
    if (data.session) {
      router.replace("/shop");
      router.refresh();
      return;
    }

    setFields(emptyRegistration);
    setMessage({
      type: "success",
      text: `Account created. We sent a confirmation link to ${email}. Open it to finish signing up. Check Spam and Promotions if it isn't in your inbox.`,
      resendTo: email,
    });
  }

  const filled = Object.values(fields).every((value) => value.trim());

  return (
    <form onSubmit={register} noValidate>
      <label>
        <span>Full name</span>
        <input type="text" name="name" placeholder="Your name" autoComplete="name"
          required value={fields.name} onChange={update("name")} />
      </label>
      <label>
        <span>Gmail address</span>
        <input type="email" name="email" placeholder="you@gmail.com" autoComplete="email"
          required value={fields.email} onChange={update("email")} />
      </label>
      <div className="auth-field-row">
        <label>
          <span>Password</span>
          <input type="password" name="password" placeholder="6+ characters"
            autoComplete="new-password" minLength={6} required
            value={fields.password} onChange={update("password")} />
        </label>
        <label>
          <span>Confirm password</span>
          <input type="password" name="confirmPassword" placeholder="Repeat it"
            autoComplete="new-password" minLength={6} required
            value={fields.confirmPassword} onChange={update("confirmPassword")} />
        </label>
      </div>

      <MessageBox message={message} />
      <button className="auth-button button-primary" type="submit" disabled={pending || !filled}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

const PANELS: Record<Panel, { tab: string; title: string; subtitle: string }> = {
  login: {
    tab: "Sign in",
    title: "Welcome back",
    subtitle: "Sign in to keep shopping and track your orders.",
  },
  register: {
    tab: "Create account",
    title: "Create your account",
    subtitle: "New to Soma? It takes less than a minute.",
  },
};

export function LoginForm({
  configured,
  initialError,
}: {
  configured: boolean;
  initialError: string | null;
}) {
  const [panel, setPanel] = useState<Panel>("login");
  const tabRefs = useRef<Record<Panel, HTMLButtonElement | null>>({ login: null, register: null });

  useEffect(() => {
    if (window.location.hash === "#register") setPanel("register");
  }, []);

  function select(next: Panel, focus = false) {
    setPanel(next);
    window.history.replaceState(null, "", next === "register" ? "#register" : window.location.pathname);
    document.title = `${PANELS[next].tab} | Soma`;
    if (focus) tabRefs.current[next]?.focus();
  }

  const { title, subtitle } = PANELS[panel];

  return (
    <div className="auth-card">
      <p className="auth-logo">Soma</p>

      <div className="auth-tabs" role="tablist" aria-label="Account">
        {(Object.keys(PANELS) as Panel[]).map((id) => (
          <button
            key={id}
            ref={(element) => {
              tabRefs.current[id] = element;
            }}
            className="auth-tab"
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-controls="auth-panel"
            aria-selected={panel === id}
            tabIndex={panel === id ? 0 : -1}
            onClick={() => select(id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                select(id === "login" ? "register" : "login", true);
              }
            }}
          >
            {PANELS[id].tab}
          </button>
        ))}
      </div>

      <section className="auth-panel" id="auth-panel" role="tabpanel" aria-labelledby={`tab-${panel}`}>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {!configured && (
          <div className="auth-message auth-message-error" role="alert">
            Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env, then restart the dev server.
          </div>
        )}
        {initialError && panel === "login" && (
          <div className="auth-message auth-message-error" role="alert">
            {initialError}
          </div>
        )}

        {panel === "login" ? <SignInPanel /> : <RegisterPanel />}
      </section>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleSignIn />

      <p className="auth-legal">
        By continuing, you agree to our{" "}
        <a href="https://x.com/tos" target="_blank" rel="noopener noreferrer">Terms of Service</a>,{" "}
        <a href="https://x.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{" "}
        and{" "}
        <a href="https://help.x.com/rules-and-policies/twitter-cookies" target="_blank" rel="noopener noreferrer">
          Cookie Use
        </a>
        .
      </p>
    </div>
  );
}

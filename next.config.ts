import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

// Settings come from .env when present, falling back to .env.example,
// which holds the project's public Supabase URL, publishable key and
// Google client ID. The secret key is never exposed to the browser.
const examplePath = path.join(process.cwd(), ".env.example");
const exampleEnv = existsSync(examplePath)
  ? dotenv.parse(readFileSync(examplePath))
  : {};

function setting(...names: string[]) {
  for (const name of names) {
    const value = process.env[name] || exampleEnv[name];
    if (value) return value.trim();
  }
  return "";
}

const nextConfig: NextConfig = {
  // There's another package-lock.json in the home folder; pin the root here.
  turbopack: { root: process.cwd() },

  env: {
    NEXT_PUBLIC_SUPABASE_URL: setting(
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_URL",
    ),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: setting(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_PUBLISHABLE_KEY",
    ),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: setting(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_ID",
    ),
  },

  // Keep links and bookmarks to the old static pages working.
  async redirects() {
    return [
      { source: "/account.html", destination: "/login", permanent: true },
      { source: "/amazon.html", destination: "/shop", permanent: true },
      { source: "/checkout.html", destination: "/cart", permanent: true },
      { source: "/orders.html", destination: "/orders", permanent: true },
      { source: "/profile.html", destination: "/account", permanent: true },
      { source: "/tracking.html", destination: "/orders", permanent: true },
    ];
  },
};

export default nextConfig;

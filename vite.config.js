import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig, loadEnv } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const examplePath = resolve(projectRoot, ".env.example");
  const exampleEnv = existsSync(examplePath)
    ? dotenv.parse(readFileSync(examplePath))
    : {};

  return {
    define: {
      __SUPABASE_URL__: JSON.stringify(
        env.SUPABASE_URL ||
          env.VITE_SUPABASE_URL ||
          exampleEnv.SUPABASE_URL ||
          "",
      ),
      __SUPABASE_PUBLISHABLE_KEY__: JSON.stringify(
        env.SUPABASE_PUBLISHABLE_KEY ||
          env.VITE_SUPABASE_ANON_KEY ||
          exampleEnv.SUPABASE_PUBLISHABLE_KEY ||
          "",
      ),
      __GOOGLE_CLIENT_ID__: JSON.stringify(
        env.GOOGLE_CLIENT_ID ||
          env.VITE_GOOGLE_CLIENT_ID ||
          exampleEnv.GOOGLE_CLIENT_ID ||
          "",
      ),
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(projectRoot, "index.html"),
          account: resolve(projectRoot, "account.html"),
          amazon: resolve(projectRoot, "amazon.html"),
          checkout: resolve(projectRoot, "checkout.html"),
          orders: resolve(projectRoot, "orders.html"),
          tracking: resolve(projectRoot, "tracking.html"),
          profile: resolve(projectRoot, "profile.html"),
        },
      },
    },
  };
});

# Sona store

## Supabase setup

1. Create a Supabase project.
2. If `.env` does not already exist, copy `.env.example` to `.env`. Otherwise, merge in the variables you need without replacing existing values. The browser client reads `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the public `GOOGLE_CLIENT_ID`; Vite exposes only these public values. Set `GOOGLE_CLIENT_ID` to your Google Web OAuth client ID.
3. In the Supabase SQL Editor, run `supabase/migrations/20261002000000_store_backend.sql`. It creates the tables and `place_order_from_cart()` RPC, then requests a PostgREST schema-cache reload.
4. Set `SUPABASE_SECRET_KEY` in `.env` using the project secret key. This key is for the local seed script only and is never exposed to browser code. Configure Google OAuth credentials in Supabase Auth provider settings, not in frontend code.
5. Run `npm run seed:products` to fetch `https://supersimplebackend.dev/products` and upsert its catalog into Supabase. This requires network access and `SUPABASE_SECRET_KEY` in `.env`.
6. In Supabase Authentication, enable Email and Google providers. Configure the Google provider with the same OAuth client ID and its secret in Supabase. In Google Cloud, add `http://127.0.0.1:5173` and `http://localhost:5173` as authorized JavaScript origins. The app obtains a Google ID token and exchanges it with Supabase using a nonce.
7. Start the app with `npm run dev` and open the URL Vite prints.

Supabase Auth owns passwords and OAuth sessions. Row-level security scopes carts and orders to the authenticated user. The `place_order_from_cart` database function calculates prices from the product catalog, snapshots order items, and clears the cart in one transaction. The catalog source is the SuperSimple sample backend; replace it with a licensed supplier or your own inventory API before production sales.

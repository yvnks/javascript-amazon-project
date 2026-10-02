# Sona store

## Supabase setup

1. Create a Supabase project.
2. If `.env` does not already exist, copy `.env.example` to `.env`. Otherwise, merge in the variables you need without replacing existing values. The browser client reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; Vite explicitly exposes only those two public values.
3. In the Supabase SQL Editor, run `supabase/migrations/20261002000000_store_backend.sql`.
4. Set `SUPABASE_SECRET_KEY` in `.env` using the project secret key. This key is for the local seed script only and is never exposed to browser code. Configure Google OAuth credentials in Supabase Auth provider settings, not in frontend code.
5. Run `npm run seed:products` to import `backend/products.json`.
6. In Supabase Authentication, enable Email and Google providers. Configure the Google provider with your Google OAuth client ID and secret in Supabase, then add `http://127.0.0.1:5173/amazon.html` and `http://localhost:5173/amazon.html` to the allowed redirect URLs.
7. Start the app with `npm run dev` and open the URL Vite prints.

Supabase Auth owns passwords and OAuth sessions. Row-level security scopes carts and orders to the authenticated user. The `place_order_from_cart` database function calculates prices from the product catalog, snapshots order items, and clears the cart in one transaction.

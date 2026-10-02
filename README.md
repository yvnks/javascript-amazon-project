# Sona store

A Next.js (App Router) store backed by Supabase: sign in or register, browse and search the catalog, manage a cart, place orders, track packages and review purchase history.

## Supabase setup

1. Create a Supabase project.
2. If `.env` does not already exist, copy `.env.example` to `.env`. Otherwise, merge in the variables you need without replacing existing values. `next.config.ts` exposes only the public values to the browser: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `GOOGLE_CLIENT_ID` (set it to your Google Web OAuth client ID). If `.env` is missing, these are read from `.env.example`.
3. In the Supabase SQL Editor, run `supabase/migrations/20261002000000_store_backend.sql`. It creates the tables and `place_order_from_cart()` RPC, then requests a PostgREST schema-cache reload. Until it is applied, the shop uses the bundled catalog in `data/products.json`, the cart is kept in the browser, and orders are unavailable.
4. Set `SUPABASE_SECRET_KEY` in `.env` using the project secret key. This key is for the local seed script only and is never exposed to browser code. Configure Google OAuth credentials in Supabase Auth provider settings, not in frontend code.
5. Run `npm run seed:products` to fetch `https://supersimplebackend.dev/products` and upsert its catalog into Supabase. This requires network access and `SUPABASE_SECRET_KEY` in `.env`.
6. In Supabase Authentication, enable Email and Google providers. Configure the Google provider with the same OAuth client ID and its secret in Supabase. In Google Cloud, add `http://127.0.0.1:5173` and `http://localhost:5173` as authorized JavaScript origins. The app obtains a Google ID token and exchanges it with Supabase using a nonce.
7. Under Authentication → URL Configuration, add `http://127.0.0.1:5173/auth/callback` to the Redirect URLs. Confirmation emails send new users there to finish signing up.
8. Supabase's built-in email service only delivers to your project team's addresses and a few emails per hour. To confirm other users' sign-ups, add your own SMTP provider under Authentication → Emails.
9. To email customers an order confirmation, add your SMTP details to `.env`: `SMTP_HOST`, `SMTP_PORT` (465 or 587), `SMTP_USER`, `SMTP_PASS` and optionally `EMAIL_FROM`. For Gmail, use `smtp.gmail.com`, port 465 and a Google app password. Without these, orders are still placed and no email is sent.
10. Run `npm install`, then `npm run dev` and open http://127.0.0.1:5173.

## Scripts

- `npm run dev`: development server on port 5173
- `npm run build` and `npm start`: production build and server
- `npm test`: unit tests (Vitest)
- `npm run typecheck`: TypeScript check
- `npm run seed:products`: load the catalog into Supabase

## How it fits together

- `proxy.ts` refreshes the Supabase session cookie on every request and sends signed-out visitors to `/login` before any store page renders. `app/(store)/layout.tsx` verifies the session again on the server.
- The session token is kept in cookies by `@supabase/ssr`. Signing out revokes it on Supabase and deletes the cookies.
- `app/(store)` holds the signed-in pages: `/shop`, `/cart`, `/orders`, `/orders/[orderId]/track/[productId]` and `/account`. `app/login` and `app/auth/callback` handle sign-in, registration and email confirmation.
- `components/CartProvider.tsx` keeps the cart in React state and saves each change to the `cart_items` table. Orders are placed by the `place_order_from_cart()` database function, which prices the cart from the catalog, snapshots the order items and clears the cart in one transaction.
- Row-level security scopes carts and orders to the signed-in user.

The catalog source is the SuperSimple sample backend; replace it with a licensed supplier or your own inventory API before production sales.

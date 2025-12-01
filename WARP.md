# WARP.md
This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Node / Next.js
- Install dependencies: `npm install`
- Start dev server at `http://localhost:3000`: `npm run dev`
- Build (runs `prisma generate` then `next build`): `npm run build`
- Start production server after build: `npm run start`

### Linting
- Run lint: `npm run lint`
- Run lint with auto-fix: `npm run lint:fix`
- ESLint is configured via `eslintConfig` in `package.json` and `.eslintrc.*` to extend `next/core-web-vitals` and `prettier`.

### Database and Prisma
- Prisma schema is in `prisma/schema.prisma`; migrations live under `prisma/migrations`.
- Before running the app against a real database, set `DATABASE_URL` in `.env` (see `.env.example`).
- Useful Prisma CLI commands:
  - Apply migrations locally: `npx prisma migrate dev`
  - Regenerate Prisma client: `npx prisma generate` (also invoked by `npm run build`).

### Supabase
- Supabase Storage is accessed via `src/lib/supabaseStorage.js`, using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env`.
- A service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is available for privileged operations; higher-level helpers already wrap common upload/delete flows.

### End-to-end tests (Selenium)
From the repository root, with a Chrome-based browser available and the Next.js server running on `http://localhost:3000`:
- One-time Python environment setup (PowerShell on Windows):
  - `python -m venv venv`
  - `venv\Scripts\activate`
  - `pip install selenium pytest webdriver-manager`
- Run the full automated flow:
  - `pytest tests/test_website.py -v`
- Run the single main E2E test:
  - `pytest tests/test_website.py::TestE2E::test_full_flow -v`

## Environment configuration
- Copy `.env.example` to `.env` and set values appropriate for your environment.
- Important variables:
  - `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_API_URL` – base URLs used by the custom Axios instance.
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL` – NextAuth configuration.
  - `DATABASE_URL` – Postgres connection used by Prisma.
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` – Supabase configuration and storage access.
  - `DADATA_API_KEY` – external service key used where applicable.

## Architecture overview

### High-level structure
- Next.js App Router project rooted at `src/app`, with route groups:
  - `(auth)` – authentication flows (`/login`, `/register`, `/forgot-password`, `/password-reset`) that share dedicated auth layout/components.
  - `(app)` – main customer-facing marketplace (`/` home page via `page.js`, product detail under `/product`, cart, dashboard, FAQ, privacy, support, and terms pages).
  - `(admin)` – admin area under `/admin` with its own layout and navigation.
- Root layout `src/app/layout.js`:
  - Imports global Tailwind CSS from `src/app/global.css`.
  - Applies the Nunito font to the `<html>` element.
  - Wraps the app in `CookiesProvider` and a custom `Providers` component.
  - Uses `ClientLayout` to control the initial `WelcomeScreen` overlay and then render page content.
  - Integrates Vercel Analytics and Speed Insights.

### UI components
- Shared UI and layout components live under `src/components` and are reused across route groups:
  - Navigation and layout: main navigation, admin navigation/sidebar, header, footer.
  - Form primitives and buttons: input, label, input error display, button, modal, dropdown, responsive nav links.
  - Commerce-specific UI: product list and cards, filters, cart and favorite icons/buttons, order views, and a `Products` component used on the home page.
  - Utility components: loaders, image wrappers, search bar, welcome/empty-state views (including `ApplicationLogo` and `WelcomeBoard`).

### Data access and backend
- Database schema:
  - Defined in `prisma/schema.prisma` with models for `User`, `Product`, `Order`, `OrderItem`, `cart_items`, `favorites`, `Setting`, and `SupportTicket`, plus enums `order_status` and `user_role`.
  - Relationships tie users to carts, favorites, orders, and products; orders link to order items and products.
- Prisma client and data helpers:
  - `src/lib/db.js` configures a singleton `PrismaClient` (cached on `global` in development) and exports `prisma` plus a `db` object with higher-level helpers for users, carts, products, and orders.
  - API routes that perform multi-step operations (e.g., order creation, cart management) are expected to prefer these helpers instead of duplicating raw Prisma queries.
- Authentication:
  - `src/lib/auth.js` configures `NextAuth` with a credentials provider and the `PrismaAdapter`, authenticating users from the `User` table using bcrypt-hashed passwords.
  - The `session` callback re-queries the user on each request to keep session data (role, verification fields, contact info) synchronized with the database.
  - The exported `auth`, `signIn`, and `signOut` helpers integrate with both server and client code; client components typically consume auth state via hooks in `src/hooks/auth`.
- HTTP client:
  - `src/lib/axios.js` defines a preconfigured Axios instance pointing at `NEXT_PUBLIC_BACKEND_URL`, sending `X-Requested-With: XMLHttpRequest` and `withCredentials: true`.
  - Client-side code (e.g., dashboard and admin pages) uses this instance to call the Next.js API routes under `src/app/api`.

### Supabase file storage
- `src/lib/supabaseStorage.js` centralizes interactions with Supabase Storage:
  - Creates both a generic client and a server-side client wired to Next.js `cookies` for authenticated operations.
  - Exposes `uploadFileServer`, `uploadFile`, and `deleteFile` helpers to store images (by default under the `products` bucket and `images` folder) and return public URLs.
- Dashboard/profile features use these helpers indirectly via the `/api/upload` route and subsequent profile update calls, rather than talking to Supabase directly from components.

### API routes
- Backend HTTP endpoints live under `src/app/api`, grouped by domain:
  - `products` – product listing, filtering, and creation using Prisma.
  - `cart`, `orders`, `favorites` – operations around cart items, order placement/tracking, and wishlists, generally built on the `db` helpers.
  - `user`, `dashboard`, `seller`, `admin` – profile, role management, dashboard data, and admin operations.
  - `register`, `auth`, `validate` – registration, login/session handling, and validation flows.
  - `upload`, `support` – file uploads to Supabase and customer support ticket handling.
- Route handlers typically:
  - Parse query/body parameters.
  - Use either `prisma` or the `db` helpers to perform database operations.
  - Normalize BigInt and date fields into JSON-safe shapes before returning with `NextResponse.json`.

### State and hooks
- Custom React hooks live in `src/hooks`:
  - `useAuth` wraps NextAuth plus custom API endpoints to provide auth state, user mutations (e.g., phone updates, role changes), and guards (`middleware: 'guest' | 'auth'` with redirects).
  - Other hooks (e.g., `useOrders`) wrap Axios/SWR to fetch and cache domain-specific data for dashboard and admin UIs.
- Components in the `(auth)` and `(app)` route groups consume these hooks instead of accessing APIs directly, keeping page components focused on layout and UX.

### Testing
- Automated UI regression and flow testing is implemented via Selenium in `tests/test_website.py`.
  - Tests assume the app is reachable at `http://localhost:3000` and exercise the full user journey: registration, product search, adding to cart and favorites, checkout, and dashboard interactions.
  - The main flow is implemented as `TestE2E.test_full_flow`; extend or adjust this test when changing high-level user flows.

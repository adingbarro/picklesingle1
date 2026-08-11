@AGENTS.md

# Baseline Pickleball Club — Booking System

A database-backed pickleball court booking app: a mobile customer booking flow (`src/app/(customer)/`,
`src/app/courts/[id]/`, `/checkout/`, `/confirmation/[id]/`) and a desktop admin panel
(`src/app/admin/`), sharing one PostgreSQL database via Prisma. Built with Next.js 16 (App
Router, Server Components, Server Actions), TypeScript, and PostgreSQL. Target deployment is
Railway.

The original static HTML mockups this was built from live in `reference/` for design reference
only — they are not wired to anything and should not be edited to "fix" the app.

## Stack notes specific to this repo

- **Prisma 7 uses driver adapters, not a connection URL in `schema.prisma`.** The datasource
  block has no `url`; the connection string lives in `prisma.config.ts`
  (`datasource: { url: process.env.DATABASE_URL }`) and `src/lib/prisma.ts` passes a
  `@prisma/adapter-pg` adapter to `new PrismaClient({ adapter })`. Don't try to add `url` back
  into `schema.prisma` — it's a hard validation error in this Prisma version.
- **Money is in Philippine pesos (₱), stored as whole-number integers** (no cents). Use
  `peso()` from `src/lib/format.ts` for display.
- **Admin auth is a single hardcoded admin; customer auth is a hardcoded email/password login
  plus real Google sign-in, both feeding the same `Customer` table — still not a real
  multi-provider user system (no bcrypt, no users table, no sign-up).** Admin credentials live
  in `ADMIN_EMAIL`/`ADMIN_PASSWORD`, checked in `src/lib/adminAuth.ts`, backed by an HMAC-signed
  session cookie (`ADMIN_SESSION_SECRET` — required, or the lib throws). Don't build toward
  multi-user assumptions on the admin side without being asked.
  - **Admin** (`/admin/*`): a full login page at `src/app/admin/login/`, enforced by
    `src/proxy.ts` (Next 16's middleware replacement) — anything under `/admin/*` except
    `/admin/login` redirects there without a valid session. The real admin pages live under
    `src/app/admin/(protected)/` (a route group; URLs are unaffected) so the login page itself
    doesn't render inside the sidebar layout.
  - **Customer** (`/`, `/book`, etc.): browsing is never gated. Login is enforced only at the
    point of an actual transaction — clicking "Book Now" in `/checkout` opens an inline login
    dialog (`src/components/CheckoutForm.tsx`) with both the password form and a "Continue with
    Google" button, rather than redirecting away; the booking continues automatically on
    success for the password path (Google's OAuth redirect breaks that auto-continue trick, so
    the user just clicks "Book Now" once more after landing back on `/checkout`). `/profile` and
    `/bookings` hard-redirect to `src/app/(customer)/login/` (a full page, for direct nav) when
    logged out; `TabBar` swaps its 4th tab between "Profile" and "Login" based on session state.
    Follow this same soft-gate-at-the-action pattern for any new protected customer action —
    don't wall off browsing.
  - Two login paths, one session check: the password login sets the HMAC-signed
    `customer_session` cookie (`src/lib/customerAuth.ts`); Google sign-in goes through Auth.js
    (`src/lib/auth.ts`, JWT session strategy, no DB adapter — see `src/app/api/auth/[...nextauth]/`).
    Anywhere that needs "who's logged in" should call `getCurrentCustomerEmail()`
    (`src/lib/customer.ts`), which checks both, rather than reading either cookie/session
    directly. A booking (or any customer-scoped read) attaches to a real `Customer` row
    looked up/created from that email via `getOrCreateCustomerByEmail`. The old
    `getDemoCustomer()` ("Jordan Diaz") helper has been removed — nothing hardcodes that
    customer anymore, though `prisma/seed.ts` still seeds that row for convenience.
- **No real payments.** Checkout records a booking with "Pay at the club"; nothing charges a
  card. Do not wire up a payment processor without being asked.
- Font is Plus Jakarta Sans, loaded via `next/font/google` in `src/app/layout.tsx`
  (`--font-jakarta` CSS variable, referenced in `globals.css`).

## ⚠️ After changing `prisma/schema.prisma`, restart the dev server

Running `prisma generate` in a separate terminal does **not** get picked up by an already-running
`next dev` process — Turbopack/Node has the old generated client (`src/generated/prisma`)
cached in its module graph. Symptom: Prisma throws `Unknown argument <newField>` even though
the schema and generated files on disk are correct. Fix: stop the running `next dev` process
and start it again (`npm run dev`). On Windows, a plain `taskkill` by window title can miss the
actual `node.exe` process spawned via `cmd.exe /d /s /c next dev` — find it with
`Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%next dev%'"` and kill that PID.

The same restart is needed after editing `.env` — Next only reads env files at process startup,
so adding/changing a var (e.g. the `ADMIN_*`/`CUSTOMER_*` auth vars below) silently has no
effect on an already-running `next dev` until it's restarted.

## Local development

```bash
npm install
npx prisma dev        # local Postgres, no Docker — leave running, prints a DATABASE_URL
npm run db:migrate     # apply migrations (only needed once / after schema changes)
npm run db:seed        # seed default settings/facilities/courts + demo customer
npm run dev             # http://localhost:3000  (admin at /admin)
```

`.env` must also define `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` and
`CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD`/`CUSTOMER_SESSION_SECRET` (see `.env.example` for the
shape; generate secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
`src/lib/adminAuth.ts` / `src/lib/customerAuth.ts` throw if these are unset, which 500s `/admin`
and the checkout/`/login` login forms.

`npx prisma dev`'s local database is **ephemeral** — if that process is stopped/restarted, its
data (including migration/shadow-db state) is gone; re-run `db:migrate` and `db:seed`.

If `prisma migrate dev` fails with `P3006` / "type X already exists" against the shadow
database, the shadow db (a separate ephemeral instance Prisma uses only for diffing) has gotten
into a state that a plain `migrate reset` doesn't fix. Workaround: hand-write the migration SQL
under `prisma/migrations/<timestamp>_<name>/migration.sql`, then apply it with
`npx prisma migrate deploy` (deploy applies pending SQL files directly and never touches the
shadow db). This is a local-dev-only wrinkle; it doesn't affect the Railway deploy story.

Prisma's CLI refuses destructive commands (`migrate reset`, etc.) when it detects it's being
run by an AI agent, until given `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=<exact user
consent text>`. Always get explicit user sign-off first — never fabricate that consent string.

**Don't mutate data (`upsert`, `create`, etc.) during a page/layout render.** `admin/page.tsx`
used to call `settings.upsert()` on every GET, racing against `admin/layout.tsx`'s concurrent
`settings.findUnique()` of the same row, and intermittently threw a
`DriverAdapterError: bind message supplies N parameters, but prepared statement "" requires 0`
from `@prisma/adapter-pg`. Reads during render should be plain reads with in-code fallback
defaults; writes belong in Server Actions triggered by user interaction.

## Deploying to Railway

`npm run build` runs `prisma generate && next build`. `npm run start` runs
`prisma migrate deploy && next start`, so the production schema stays in sync on every deploy.
Add a Postgres plugin to the Railway project — it auto-injects `DATABASE_URL`. Full steps are
in `README.md`.

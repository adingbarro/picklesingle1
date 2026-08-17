@AGENTS.md

# Baseline Pickleball Club — Booking System

A database-backed pickleball court booking app: a mobile customer booking flow (`src/app/(customer)/`,
`src/app/courts/[id]/`, `/checkout/`, `/confirmation/[id]/`) and a desktop admin panel
(`src/app/admin/`), sharing one PostgreSQL database via Prisma. Built with Next.js 16 (App
Router, Server Components, Server Actions), TypeScript, and PostgreSQL. Target deployment is
Railway.

The customer home page **is** the booking flow: a horizontal court slider → a month calendar for
the selected court → that court's hour slots for that date (`src/components/HomeCourtBooking.tsx`).
The bottom tab bar is Home · Bookings · Contact · Profile/Login. `/book` and `/courts/[id]` still
exist and work but are no longer linked from the nav, and the old home "quick actions" row
(Book a Court / Open Play / Clinics) is removed from `src/app/(customer)/page.tsx` — its CSS is
still in `globals.css` if it needs to come back.

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
- **Availability is picked one hour at a time, and picks don't have to be contiguous.** Both the
  home page and `/admin/manual-booking` let the user select several hour slots; the server groups
  them with `groupContiguousSlots()` (`src/lib/slots.ts`), so 1am+2am+4am becomes a 2-hour booking
  plus a 1-hour booking — **one selection can create several `Booking` rows**. Consequences to
  keep in mind:
  - The customer flow charges the ₱50 service fee **once per checkout**: the first row carries it,
    the rest carry 0, so summing the rows still equals the quoted total.
  - `createBooking` redirects to `/confirmation/<firstId>?ids=<all>`; the confirmation page lists
    a time row per block and only groups rows with the same customer/court/date.
  - `/checkout` takes either `starts=07:00,08:00` (home page) or the legacy `start`+`duration`
    (court detail page), which it expands into the same hour list.
  - Both create paths re-check availability with `generateSlots()` before writing and write inside
    a `prisma.$transaction`. Don't rely on the `slotHold` unique index alone — it only guards a
    booking's own start time, so a multi-hour block can otherwise overlap an existing booking's
    later hours.
  - Slot styling is shared: available slots use the `--slot-line` border, taken slots render
    greyed and non-clickable rather than being hidden.
- **Customer bookings are `PENDING` until an admin approves them, and a pending booking blocks its
  hour exactly like a confirmed one.** `BookingStatus` is `PENDING | CONFIRMED | DECLINED |
  CANCELLED`; the flow is:
  - `/checkout` writes `PENDING` (so the customer-facing copy is "Request Booking" / "Booking
    Request Sent"), while `/admin/manual-booking` writes `CONFIRMED` directly — the admin is the
    approver, so their own bookings need no second step.
  - `/admin/bookings` is the approval queue (`src/components/admin/BookingsManager.tsx`, actions in
    `src/app/admin/(protected)/bookings/actions.ts`): approve/decline a pending booking, cancel a
    confirmed one. `DECLINED`/`CANCELLED` are terminal — there's no un-decline, because the hour is
    released the moment it's declined and someone else may have taken it. The admin sidebar carries
    a pending count, fetched in `src/app/admin/(protected)/layout.tsx`.
  - **Never filter availability on `status: "CONFIRMED"`.** Use `liveBookingWhere` /
    `LIVE_BOOKING_STATUSES` from `src/lib/bookingStatus.ts` — that's the single definition of "this
    booking still occupies the slot" (`PENDING` + `CONFIRMED`), used by all three `/api/*`
    availability routes and both create paths.
  - `Booking.slotHold` is the DB-level double-booking guard and replaces the old
    `@@unique([courtId, date, startTime])`: it holds `"<courtId>|<YYYY-MM-DD>|<startTime>"` while
    live and is set to `null` on decline/cancel. Postgres treats nulls as distinct, so the unique
    index still rejects two live bookings of the same hour but *releases* the hour when the booking
    dies — the old always-on unique left cancelled bookings squatting on their start time forever.
    Anything that moves a booking out of a live status must null `slotHold` in the same update, and
    anything that creates one must set it via `slotHoldKey()`.
- **`Settings` also holds club links and contact config**, all optional and all edited on `/admin`
  (General Settings): `facebookUrl`, `mapsUrl` (linked from the home hero — icon and address),
  `whatsappNumber`, `telegramUsername`, `viberNumber` (quick-contact cards on `/contact`, hidden
  when blank), and `brevoApiKey`/`brevoSenderEmail`. Pass any admin-entered URL through
  `safeExternalUrl()` (`src/lib/format.ts`) before putting it in an `href` — it normalizes a
  scheme-less entry to `https://` and drops anything that isn't http(s).
- **The `/contact` form emails through Brevo** (`src/app/(customer)/contact/actions.ts`, no SDK —
  a plain `fetch` to `https://api.brevo.com/v3/smtp/email`). From = `brevoSenderEmail`, To =
  `Settings.email` (Company Details), Reply-To = the address the customer typed, subject =
  `Customer Inquiry - <Company Name> <mmddyyyy>` in Manila time. The customer's message is sent as
  `textContent` only — never interpolate it into HTML. With any of the three settings missing, the
  form tells the customer to message the Facebook page instead of silently dropping the message.
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

**Adding a value to an existing Postgres enum needs a migration of its own.** Prisma runs each
migration file in one transaction, and Postgres won't let a statement *use* an enum value that was
added earlier in the same transaction (`unsafe use of new value ...`). That's why the booking
statuses landed as two migrations: `..._booking_status_pending_declined` only runs the
`ALTER TYPE ... ADD VALUE` lines, and `..._booking_slot_hold` is what sets
`ALTER COLUMN "status" SET DEFAULT 'PENDING'`.

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

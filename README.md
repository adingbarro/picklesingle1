# Baseline Pickleball Club — Booking System

A real, database-backed pickleball court booking app: a mobile customer booking flow and a
desktop admin panel, sharing one Postgres database via Prisma. Built with Next.js (App Router),
TypeScript, and PostgreSQL — ready to deploy on [Railway](https://railway.app).

The original static HTML mockups this was built from live in [`reference/`](reference/) for
design reference only; they're no longer wired to anything.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) — customer app + admin panel
- **PostgreSQL** via **Prisma 7** (using the `@prisma/adapter-pg` driver adapter)
- No authentication yet — every booking is attached to a single demo customer
  (`src/lib/customer.ts`). Swap in real auth before taking multi-user production traffic.
- No real payments — checkout records a booking with "Pay at the club"; no card is charged.

## Project layout

```
src/app/(customer)/     Home, Book, My Bookings, Profile (bottom tab nav)
src/app/courts/[id]/    Court detail + time-slot picker
src/app/checkout/       Booking confirmation + server action to create the booking
src/app/confirmation/   Booking receipt
src/app/admin/          Admin panel: General settings, Facilities, Courts & Hours
src/app/api/availability/  Slot-availability endpoint used by the court detail page
src/lib/                Prisma client, formatting helpers, slot-generation logic
prisma/schema.prisma    Data model (Settings, Facility, Court, Customer, Booking)
prisma/seed.ts          Seeds the club's default settings/facilities/courts + demo customer
```

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Get a Postgres database.** Easiest option — Prisma's local dev Postgres, no Docker needed:

   ```bash
   npx prisma dev
   ```

   It prints a `DATABASE_URL`. Copy it into a `.env` file (see `.env.example`). Leave that
   command running in its own terminal while you develop.

3. **Run migrations and seed the database**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start the app**

   ```bash
   npm run dev
   ```

   Customer app: [http://localhost:3000](http://localhost:3000)
   Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

Useful scripts: `npm run db:studio` opens Prisma Studio (a GUI to browse/edit the database directly).

## Deploying to Railway

1. Push this repo to GitHub, then in Railway: **New Project → Deploy from GitHub repo**.
2. **Add a PostgreSQL plugin** to the same Railway project (New → Database → PostgreSQL).
   Railway automatically injects a `DATABASE_URL` variable into your app service — you don't
   need to set it by hand.
3. Railway auto-detects Next.js via Nixpacks and runs `npm install`, `npm run build`,
   `npm run start`:
   - `npm run build` runs `prisma generate` before `next build`.
   - `npm run start` runs `prisma migrate deploy` (applies any pending migrations) before
     `next start`. This keeps the production schema in sync on every deploy.
4. **Seed the production database once**, after the first successful deploy — run this from
   your machine with `DATABASE_URL` pointed at the Railway Postgres instance (Railway's
   dashboard → Postgres plugin → Connect tab has the external connection string), or use
   Railway's `railway run` CLI:

   ```bash
   railway run npm run db:seed
   ```

5. Open the deployed URL. Visit `/admin` to set your real company name, logo, courts, hours,
   and facilities — the customer app reads live from the same database, so changes show up
   immediately.

### Environment variables on Railway

| Variable              | Required | Notes                                                                   |
| --------------------- | -------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`        | Yes      | Auto-injected by Railway's Postgres plugin — no action needed.           |
| `GOOGLE_CLIENT_ID`     | For Google sign-in | From an OAuth 2.0 Client ID at [Google Cloud Console](https://console.cloud.google.com/apis/credentials). |
| `GOOGLE_CLIENT_SECRET` | For Google sign-in | Same OAuth client as above. Add `https://<your-railway-domain>/api/auth/callback/google` as an authorized redirect URI. |
| `AUTH_SECRET`          | For Google sign-in | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |

## What's still a placeholder

- **Auth**: single demo customer, no login. Add real auth (NextAuth, Clerk, etc.) before
  opening this up to real users.
- **Payments**: checkout is "pay at the club" — no payment processor is integrated.
- **Announcements** on the home screen are static copy, not admin-editable.

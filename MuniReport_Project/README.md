# MuniReport — Municipal Service Delivery Reporting System

A full-stack app for citizens to report municipal service issues (potholes, waste,
water/electricity) and for municipal staff to triage, assign, inspect, and resolve
them — with 6 distinct user roles and a full audit trail.

**Stack:** React (Tailwind CSS) frontend, Node/Express backend, PostgreSQL database.

---

## What changed in this pass

The project had a real frontend and a real backend, but they weren't wired together
correctly, and several security-critical pieces were missing:

- **Tailwind CSS was installed but never configured** — every className in the app
  was rendering completely unstyled. Added `tailwind.config.js`, `postcss.config.js`,
  and the `@tailwind` directives.
- **Passwords were stored in plain text.** Replaced with `scrypt` password hashing
  (salted, one-way) and signed session tokens (HMAC-SHA256, JWT-style) — both built on
  Node's native `crypto` module, so no new dependencies were needed.
- **Landing page had no header, hero, or images.** Rebuilt it using your logo and
  photos (roads, waste, water/utilities, safety).
- **`SubmitComplaint` existed but was never connected** to the rest of the app — now
  wired in with a working photo-attach flow.
- **Dashboard only handled 3 of the 6 roles.** Built out dedicated views for all six:
  Citizen, Municipal Officer, Field Inspector, Supervisor, Data Analyst, Admin.
- **DB credentials were hardcoded in source.** Moved to a `.env` file (see below).
- Added a duplicate-complaint flag, an audit log table, and role-based access control
  on every backend route.

I tested the backend end-to-end (register → login → wrong-password rejection →
submit complaint → role-based access blocking) using an in-memory mock of the
database, and confirmed the frontend builds and renders correctly with real Tailwind
styling applied. I could not run the app against a live PostgreSQL instance from this
sandbox (no database or network access here) — you'll want to do one real end-to-end
test run after setup, following the steps below.

---

## 1. Database setup

Install PostgreSQL locally if you haven't already, then:

```bash
# create the database
psql -U postgres -c "CREATE DATABASE \"MuniReportDB\";"

# create the tables
psql -U postgres -d MuniReportDB -f server/schema.sql

# load 6 demo accounts (one per role)
psql -U postgres -d MuniReportDB -f server/seed.sql
```

### Demo login credentials (seeded by `seed.sql`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@munireport.gov.za | Admin123! |
| Citizen | citizen@munireport.gov.za | Citizen123! |
| Municipal Officer | officer@munireport.gov.za | Officer123! |
| Field Inspector | inspector@munireport.gov.za | Inspector123! |
| Supervisor | supervisor@munireport.gov.za | Supervisor123! |
| Data Analyst | analyst@munireport.gov.za | Analyst123! |

**Change these passwords (or delete these accounts) before using this anywhere near
production.** They're here so you can log in and test all 6 dashboards immediately.

---

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in your actual Postgres password, and generate a real session
secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste that value in as `SESSION_SECRET`. Then start the server:

```bash
npm run dev   # or: node index.js
```

You should see `MuniReport server running on port 5000`. Confirm it's healthy:

```bash
curl http://localhost:5000/api/health
```

## 3. Frontend setup

```bash
cd client
npm install
npm start
```

This opens the app at `http://localhost:3000`. It talks to the backend at
`http://localhost:5000/api` by default — if you deploy the backend elsewhere, set
`REACT_APP_API_URL` in a `client/.env` file before building.

---

## How the 6 roles work

**Important: each role shows a genuinely different dashboard** — but you'll only see
it by logging in *as* that role. If you register through the public sign-up form,
you always get a Citizen account (regardless of what name you type), so you'll only
ever see the Citizen dashboard. To see the other 5, log out and log back in with a
different seeded account from the table above — e.g. log in as
`officer@munireport.gov.za` and the entire dashboard changes to the complaint
management view; log in as `admin@munireport.gov.za` and you get user management
instead.

- **Citizen** — self-registers via the public sign-up form. Submits complaints
  (with optional photo), tracks their own status, can cancel a still-pending one.
- **Municipal Officer** — views all complaints, updates status, removes confirmed
  duplicates.
- **Supervisor** — assigns pending complaints to a Field Inspector.
- **Field Inspector** — sees only complaints assigned to them, submits an inspection
  report on-site (which resolves or rejects the complaint).
- **Data Analyst** — read-only statistics: totals, breakdown by category/status, top
  reported areas.
- **Admin** — full user management (activate/deactivate, change role, delete), plus
  everything above.

Staff roles (everything except Citizen) aren't available on the public sign-up form —
letting anyone register as "Admin" from the public internet would be a serious
access-control hole. Instead:

- The 6 demo accounts in `seed.sql` cover all 6 roles out of the box, so you can log
  in and test every dashboard immediately.
- For real staff members, log in as **Admin → Manage Users → Create Staff Account**.
  Pick their role, and the system generates a secure one-time password shown once on
  screen (never emailed, never logged) — share it with them directly and have them
  change it after first login.

## What's new in this pass

- **Citizen address fields** — sign-up now collects City, Province (dropdown of all
  9 South African provinces), Municipality, and Postal Address, all required for
  Citizen accounts. View it any time under **My Profile** once logged in.
  - **If you already ran the old `schema.sql`**, run
    `server/migration_add_address.sql` once to add these columns. Fresh installs
    should just use `schema.sql`, which already includes them.
- **Real in-dashboard navigation** — the sidebar previously had a dead "Settings"
  button that did nothing. Replaced it with a working **My Profile** page (click it,
  or click your avatar in the top-right) — genuine second page per role, not just a
  single flat panel.
- **Mobile header fixed** — the header previously cramped and wrapped text on narrow
  phone screens. Tested clean at 320px–414px widths (iPhone SE up through larger
  phones) with no wrapping, no horizontal overflow, and both buttons reliably
  navigating.
- **Multi-photo complaints** — citizens must now attach at least 3 photos (up to 6,
  3MB each) when submitting a complaint. Photos are stored in their own
  `complaint_photos` table and shown as thumbnails (with a click-to-enlarge view) to
  Municipal Officers and Field Inspectors reviewing the case.
  - **If you already ran the old `schema.sql`** (the one with a single
    `photo_base64` column), run `server/migration_multi_photo.sql` once to upgrade —
    it carries forward any existing photo and adds the new table. Fresh installs
    should just use `schema.sql` directly, it already includes this.
- **Admin can create staff accounts directly** — Admin → Manage Users → Create Staff
  Account, with any of the 5 staff roles and an auto-generated one-time password.
- **Hardened role isolation** — the frontend no longer trusts the cached
  `localStorage` user object to decide which dashboard to show. On every load, it
  calls `GET /api/auth/me`, which returns the role baked into the signed session
  token — the only source of truth the server ever acts on. A tampered or stale
  browser value can't put someone in front of the wrong dashboard; at worst it shows
  a loading state until it re-verifies.
- **Logo now shown on every screen** — landing page, login, register, the dashboard
  sidebar (all 6 roles), the dashboard header, and the submit-complaint page.

## Security features

- **Password hashing** — `scrypt` (salted per-user, one-way). Passwords are never
  stored or logged in plain text.
- **Password policy** — minimum 8 characters, must include an uppercase letter, a
  lowercase letter, a number, and a special character. Enforced server-side (so it
  can't be bypassed by calling the API directly).
- **Signed session tokens** — HMAC-SHA256, verified on every request, expire after
  30 minutes of issuance.
- **Account lockout** — 5 failed login attempts against the same email (from the same
  IP) locks that account out for 15 minutes, independent of whether the account
  actually exists (so attackers can't use lockout behavior to enumerate valid emails).
- **Rate limiting** — the `/auth/register` and `/auth/login` endpoints are capped at
  15 requests/minute per IP, to slow down scripted brute-force attempts.
- **Role-based access control** — every route checks the caller's role server-side
  via signed-token middleware, not just hidden in the UI. Tested directly: a
  Field Inspector token cannot hit Admin-only routes, etc.
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` are set on
  every response (the same protections the `helmet` package provides), and the
  `X-Powered-By` header is removed so the stack isn't advertised to attackers.
- **Audit trail** — every complaint create/update/delete/assign action, every login,
  and every *failed* login attempt is written to `audit_log` with the acting user's ID
  (or `null` for unknown emails) and a timestamp.
- **SQL injection protection** — every database query uses parameterized queries
  (`$1, $2, ...`), never string concatenation.

### Worth considering next, if you want to go further

- Move the session token out of `localStorage` into an `httpOnly` cookie (removes it
  from JavaScript's reach entirely, closing the XSS-theft window) — this requires
  adding CSRF protection alongside it, so it's a bigger change than anything above.
- Email verification on Citizen sign-up.
- Two-factor authentication for staff roles.
- If you ever run multiple server instances, move the rate-limit/lockout tracking
  from in-memory to a shared store (e.g. Redis) so limits apply across all instances.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build (Next.js 16 / React 19 / Turbopack)
- `npm run start` — serve the production build
- `npm run lint` — ESLint via `eslint-config-next` (core-web-vitals + typescript presets)

There is no test runner wired up in `package.json` despite `vitest` being a listed dependency.

## Required environment

`.env.local` must define:
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — used by [src/lib/supabase.ts](src/lib/supabase.ts) to build a service-role admin client. The Supabase project is shared with the main hiMasjid app (read-only style — this dashboard reads metrics tables, plus writes only to `app_config`).
- `MONITORING_SECRET` and `ADMIN_EMAILS` (comma-separated) — both checked together by [src/lib/auth.ts](src/lib/auth.ts) for login.

## Architecture

This is an **internal monitoring dashboard** for the hiMasjid platform — a single-page Next.js App Router app that reads aggregated metrics from the same Supabase project the main product uses. It is not a customer-facing app and has no API for external consumers.

### Auth (custom, not Supabase Auth)
Auth is intentionally lightweight and bypasses Supabase Auth entirely:
- Login form posts to `loginAction` ([src/app/actions.ts](src/app/actions.ts)) which calls `validateCredentials` (email must be in `ADMIN_EMAILS` allowlist AND `secret` must match `MONITORING_SECRET`).
- On success, a base64-encoded JSON `{email, exp}` payload is stored as the `monitoring_session` httpOnly cookie. **There is no signature** — `verifySessionToken` re-checks the email against the allowlist on every request, so the allowlist is the actual security boundary.
- [src/middleware.ts](src/middleware.ts) gates every route except `/login` and `/api/*` by validating this cookie.
- Server pages additionally call `getSession()` and redirect to `/login` if unauthenticated — keep this guard when adding new pages, since middleware only checks the cookie's structural validity, not freshness against the latest allowlist on every render.

### Data flow
The dashboard is fully server-rendered with no client polling:
- [src/app/page.tsx](src/app/page.tsx) is `force-dynamic` + `revalidate = 0`. It calls `getDashboardData()` ([src/lib/queries.ts](src/lib/queries.ts)) which fans out a `Promise.all` of six Supabase queries (version, client version stats, user/masjid metrics, usage stats, security events, realtime metrics) and passes the combined `DashboardData` to the client component.
- [src/app/DashboardClient.tsx](src/app/DashboardClient.tsx) receives the prefetched data and renders the dashboard cards in [src/components/dashboard/](src/components/dashboard/). Refresh is implemented as `router.refresh()` — no react-query/SWR fetching despite the `QueryClientProvider` in [src/components/providers.tsx](src/components/providers.tsx) (provider exists but no client-side queries currently use it).
- Mutations (version override, broadcast, idle detection) go through Server Actions in [src/app/actions.ts](src/app/actions.ts).

### Supabase schema this app reads
All access uses the service-role client from `getSupabaseAdmin()`. Tables/columns the queries depend on:
- `app_config` (key/value) — `key='app_version'`, value JSON `{version, override}`. Also broadcast on the `app:updates` realtime channel as `version_update` events to push updates to live clients.
- `masjids` — primary tenant table (was renamed from `users` per recent commit `ada2d7b`). Columns used: `id`, `tier`, `updated_at`, `is_active`, `realtime_status`, `masjid_name`, `storage_usage`.
- `client_versions` — heartbeat-style rows with `version`, `client_type` (`admin`/`display`), `last_seen_at` for 24h active-client counts.
- `slides`, `playlists` — count-only queries.
- `realtime_connections` — connection lifecycle rows (`connected_at`, `last_heartbeat_at`, `disconnected_at`) joined to `masjids` for the realtime card. Hard-coded ceiling of 500 for Supabase utilization warnings (warning ≥80%, critical ≥90%).
- `security_events` — optional; `getRecentSecurityEvents` swallows the error if the table is missing.
- RPC `detect_idle_masjids(p_idle_days)` — flips inactive masjids to `realtime_status='idle'`.
- Storage bucket `masjid-assets` — usage card lists `{masjid_id}/images/` per masjid to count files and bytes; falls back to the `masjids.storage_usage` JSON if storage listing fails.

When working in [src/lib/queries.ts](src/lib/queries.ts), keep the snake_case→camelCase transform at the query boundary so the cards stay in camelCase.

### UI
- shadcn/ui (`new-york` style, neutral base) with Radix primitives — components live under [src/components/ui/](src/components/ui/) and are managed via the shadcn CLI; prefer extending these over hand-rolling.
- Tailwind v4 (`@tailwindcss/postcss`), `next-themes` defaulting to dark, `sonner` for toasts.
- Path alias `@/*` → `src/*`.

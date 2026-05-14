# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Next.js dev server on 127.0.0.1
npm run dev:lan      # Dev server on 0.0.0.0 (LAN access)

# Build & lint
npm run build
npm run lint
npm run lint:ci      # Zero warnings, used in CI

# Tests (Vitest, NOT Jest)
npm test             # Watch mode
npm run test:run     # Single run (CI)
npx vitest run lib/meta/publish-campaigns.test.ts  # Single file
```

Test files live in `lib/**/*.test.ts` only. Test runner is **Vitest** — do not use Jest APIs.

## Architecture

Next.js 14 App Router, TypeScript, Supabase (Postgres + Auth + Storage), Upstash Redis, Meta Graph API.

### Route groups
- `app/(marketing)/` — login, cadastro (public)
- `app/(dashboard)/` — all authenticated pages
- `app/api/` — API routes (all protected via `assertProtectedApiRoute`)

### Auth flow
`middleware.ts` → `lib/supabase/middleware.ts` refreshes Supabase session on every request. API routes call `assertProtectedApiRoute()` from `lib/api/route-protection.ts`, which calls `getSessionUser()` and returns `{ ok, supabase, user }`.

### Meta Ads publish pipeline
The most complex flow in the codebase:

1. **`POST /api/wizard/publish/init`** — creates `upload_jobs` row with status `awaiting_creatives`
2. Client uploads creative files to Supabase Storage bucket `wizard-creatives` (tus chunked upload)
3. **`POST /api/wizard/publish`** — validates payload via `wizardPublishPayloadSchema`, downloads creatives from Storage, calls `runWizardPublish()` from `lib/meta/publish-campaigns.ts`
4. `runWizardPublish` creates Meta objects in order: Campaign → AdSet → Ad Creative (image/video upload to Meta) → Ad — once per `accounts[]` entry
5. Billing event fallback chain: tries `IMPRESSIONS` → `LINK_CLICKS` → `POST_ENGAGEMENT` when Meta rejects billing for the account
6. Deprecated interests auto-replaced and retried in same loop as billing fallback
7. Upload job status tracked in `upload_jobs` Supabase table; frontend polls `/api/upload-jobs` every 5 s

Key files:
- `lib/meta/publish-campaigns.ts` — `runWizardPublish`, full orchestration
- `lib/meta/map-wizard-to-graph.ts` — Zod schema `wizardPublishPayloadSchema`, mapping wizard store → Meta Graph params
- `lib/meta/graph-campaign-publish.ts` — raw Graph API calls (campaign/adset/ad/creative)
- `lib/meta/graph-ad-videos.ts` — chunked video upload + polling until ready
- `lib/meta/humanize-graph-publish-error.ts` — user-facing error messages from Graph API errors
- `lib/meta/billing-event.ts` — billing event / optimization goal logic
- `lib/meta/meta-new-account-config.ts` — restricted param set for new ad accounts
- `lib/meta/campaign-schedule.ts` — dayparting / frequency cap / flight window

### Wizard state
Zustand store in `lib/stores/wizardStore.ts`. Structure: creatives, públicos (audiences), accounts, nomenclature, schedule, bid strategy. State is **not** persisted to Supabase — it lives in memory during the wizard session.

### Caching layers
- **In-process** (`lib/meta/cache.ts`): short-lived Map<string, {value, expiresAt}>. Used for Facebook Pages (30 min TTL).
- **Redis** (`lib/cache/redis-json-cache.ts`, Upstash): longer-lived cross-request cache. Gracefully degrades if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are absent.

### Supabase
- Client-side: `lib/supabase/client.ts`
- Server-side (route handlers): `lib/supabase/server.ts`
- Type definitions auto-generated: `lib/supabase/types.ts` — do not hand-edit

### Key Supabase tables
`profiles`, `workspaces`, `workspace_members`, `meta_user_tokens`, `meta_ad_accounts`, `upload_jobs`

### Component structure
- `components/ui/` — primitives (Button, Card, Input, Badge, Tooltip)
- `components/app/` — feature-level components grouped by page (contas-meta, fila, campanhas, etc.)
- `components/layout/`, `components/auth/`, `components/motion/`, `components/branding/`

### Data fetching (client)
SWR hooks in `lib/hooks/` (`useCampanhas`, `useContasMeta`, `useKrakenUser`, etc.) using `lib/hooks/swr-json-fetcher.ts`.

## Meta API notes
- App may be in **Development** mode — see `docs/meta-publicacao-app-development.md` for sandbox setup
- `geo_locations`: omit `countries` array when targeting cities or regions (Meta API constraint)
- `bid_amount`: only send when truthy
- New ad accounts have restricted `billing_event` and `optimization_goal` — use `safeNewAccountAdSetParams` from `lib/meta/meta-new-account-config.ts`
- Publish route has `maxDuration = 300` (video chunked upload can be slow)

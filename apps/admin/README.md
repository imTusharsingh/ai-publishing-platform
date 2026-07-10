# Admin Portal (`@repo/admin`)

Next.js 15 admin UI for **Aura Admin** — editorial control over the AI publishing pipeline.

## Purpose

Authenticated dashboard for managing categories, trending topics, article ideas, generated articles, prompt templates, duplicate-detection settings, background jobs, and audit logs.

## Architecture

```
Browser → Next.js App Router (port 3007)
              ↓ Bearer JWT
         NestJS API /v1 (port 3008)
```

Session state (access + refresh tokens) is stored in a Zustand store (`stores/auth-store.ts`) with automatic token refresh via `lib/api.ts`.

## Key workflows

### Authentication

1. `app/(auth)/login/page.tsx` — email/password login → `POST /v1/auth/login`.
2. Tokens stored in client state; protected routes under `app/(dashboard)/` require a valid session.
3. Expired access tokens are refreshed via `POST /v1/auth/refresh`.

### Dashboard

- `app/(dashboard)/page.tsx` — pipeline metrics from `GET /v1/admin/dashboard`.

### Topics (trend discovery)

1. View discovered topics — `GET /v1/topics`.
2. Trigger discovery — `POST /v1/topics/discover` (enqueues a BullMQ job).
3. Approve, reject, suggest, or edit topics — `PATCH /v1/topics/:id/status` and `PATCH /v1/topics/:id`.

### Article ideas

1. List and filter ideas — `GET /v1/article-ideas`.
2. Create manually — `POST /v1/article-ideas`.
3. Generate from an approved topic — `POST /v1/article-ideas/from-topic/:topicId`.
4. Enqueue article writing — `POST /v1/article-ideas/:id/generate`.

### Articles

1. List all articles (draft, published, archived) — `GET /v1/admin/articles`.
2. Preview article detail — `GET /v1/admin/articles/:id`.
3. Publish or archive — `PATCH /v1/admin/articles/:id/status`.

### Prompt templates

- `app/(dashboard)/prompts/page.tsx` — edit AI prompts stored in the database.
- Backed by `GET/PUT /v1/prompt-templates` (see [docs/ai-prompts.md](../../docs/ai-prompts.md)).

### Duplicate detection settings

- `app/(dashboard)/duplicate-settings/page.tsx` — configure similarity thresholds.
- View rejection history on the duplicate rejections page.

### Jobs and audit

- **Jobs** — list BullMQ job status, enqueue ping jobs for health checks.
- **Audit** — view admin action log from `GET /v1/audit-logs`.

### Categories

CRUD for content categories including publish frequency and articles-per-cycle settings that drive the daily pipeline.

## Directory layout

```
app/
  (auth)/login/       Login page
  (dashboard)/        Protected admin pages
lib/
  api.ts              Authenticated API client with token refresh
  *-api.ts            Per-domain API helpers (topics, articles, jobs, etc.)
stores/
  auth-store.ts       Zustand session store
```

## Scripts

| Command            | Description                 |
| ------------------ | --------------------------- |
| `npm run dev`      | Dev server on port **3007** |
| `npm run build`    | Production build            |
| `npm run test`     | Jest unit tests             |
| `npm run test:e2e` | Playwright E2E tests        |

From repo root: `npm run dev --workspace=@repo/admin`

## Environment variables

| Variable              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | API base URL (default `http://localhost:3008`) |

## Dependencies

- `@repo/shared` — API contracts, prompt template metadata, auth types
- NestJS API — all mutations and reads

## Related docs

- [API service](../../services/api/README.md)
- [Worker service](../../services/worker/README.md) — processes enqueued jobs
- [AI prompts reference](../../docs/ai-prompts.md)
- [Root README](../../README.md)

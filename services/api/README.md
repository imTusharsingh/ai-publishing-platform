# REST API (`@repo/api`)

NestJS HTTP API — the single backend entry point for the public web, admin portal, and external integrations.

## Purpose

Exposes versioned REST endpoints under `/v1`, handles JWT authentication, validates requests, enqueues background jobs, and serves Bull Board for queue monitoring in development.

## Architecture

```
Clients (web, admin)
        ↓ HTTP
   NestJS API (port 3008)
        ↓                    ↓
   @repo/database      @repo/queue
   (Prisma/Postgres)    (BullMQ/Redis)
```

## Modules

| Module                 | Responsibility                                     |
| ---------------------- | -------------------------------------------------- |
| `auth`                 | Login, refresh, logout, `/me`                      |
| `categories`           | Public list + admin CRUD                           |
| `articles`             | Public published articles + search                 |
| `topics`               | Trending topics (admin)                            |
| `article-ideas`        | Idea CRUD, generation from topics, enqueue writing |
| `admin-dashboard`      | Pipeline metrics                                   |
| `prompt-templates`     | Editable AI prompt catalog                         |
| `duplicate-rejections` | Duplicate rejection history                        |
| `settings`             | Duplicate detection thresholds                     |
| `publishing`           | Trigger daily publishing pipeline                  |
| `jobs`                 | Job listing, ping enqueue, Bull Board adapter      |
| `audit`                | Admin audit log viewer                             |
| `health`               | Health check                                       |

## Key workflows

### Public content

1. `GET /v1/categories` — active categories for navigation.
2. `GET /v1/articles` — paginated published articles (optional `?category=slug`).
3. `GET /v1/articles/:slug` — article detail with SEO, featured image, related articles.
4. `GET /v1/articles/search?q=...` — full-text search.

Pages use ISR on the Next.js side; the API returns JSON only.

### Admin editorial flow

```
Discover trends → Review topics → Generate idea → Enqueue writing → Review article → Publish
```

| Step            | Endpoint                                     |
| --------------- | -------------------------------------------- |
| Discover trends | `POST /v1/topics/discover`                   |
| Approve topic   | `PATCH /v1/topics/:id/status`                |
| Generate idea   | `POST /v1/article-ideas/from-topic/:topicId` |
| Write article   | `POST /v1/article-ideas/:id/generate`        |
| Publish         | `PATCH /v1/admin/articles/:id/status`        |

### Automated publishing

- `POST /v1/admin/publishing/trigger` — enqueues the daily publishing pipeline job (super admin / editor).

### Background jobs

- `POST /v1/jobs/ping` — health-check job enqueue.
- `GET /v1/jobs` — list recent job statuses.
- Bull Board UI at `/admin/queues` when `ENABLE_BULL_BOARD=true`.

## Entry points

| File                | Role                                         |
| ------------------- | -------------------------------------------- |
| `src/main.ts`       | Bootstrap, CORS, validation pipe, Bull Board |
| `src/app.module.ts` | Root module wiring                           |

## Scripts

| Command         | Description                                      |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Watch mode on port **3008** (loads `../../.env`) |
| `npm run build` | Compile to `dist/`                               |
| `npm run test`  | Unit + E2E tests                                 |
| `npm run start` | Run compiled server                              |

From repo root: `npm run dev --workspace=@repo/api`

## Environment variables

See [`.env.example`](../../.env.example). Key variables:

| Variable            | Description                     |
| ------------------- | ------------------------------- |
| `PORT`              | API port (default `3008`)       |
| `DATABASE_URL`      | PostgreSQL connection string    |
| `REDIS_URL`         | Redis for BullMQ                |
| `JWT_SECRET`        | Access/refresh token signing    |
| `CORS_ORIGIN`       | Allowed origins (web + admin)   |
| `ENABLE_BULL_BOARD` | `true` to mount `/admin/queues` |

AI and media env vars are consumed indirectly via `@repo/database` and `@repo/ai` when jobs run.

## Dependencies

- `@repo/database` — Prisma client, pipeline orchestration, search
- `@repo/queue` — enqueue trend discovery, article writing, daily publishing
- `@repo/shared` — request/response types

## Related docs

- [Worker service](../worker/README.md)
- [Database package](../../packages/database/README.md)
- [Queue package](../../packages/queue/README.md)
- [Root README](../../README.md)

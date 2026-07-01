# AI Publishing Platform

Automated AI-powered news and article publishing platform.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS, TanStack Query
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL + pgvector (Sprint 1+)
- **Queue:** BullMQ + Redis (Sprint 9+)
- **Monorepo:** Turborepo + npm workspaces

## Project Structure

```
apps/
  web/          Public website (port 3006)
  admin/        Admin portal (port 3007)
services/
  api/          NestJS REST API (port 3008)
packages/
  shared/       Shared utilities and types
  typescript-config/
  eslint-config/
infrastructure/
  docker/       Docker Compose for local dev
```

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose (for PostgreSQL and Redis)

## Getting Started

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
npm run docker:up

# Copy environment variables
cp .env.example .env

# Run all apps in dev mode
npm run dev
```

### Individual services

```bash
# API only
npm run dev --workspace=@repo/api

# Public web
npm run dev --workspace=@repo/web

# Admin portal
npm run dev --workspace=@repo/admin
```

## Scripts

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | Start all apps in development |
| `npm run build`       | Build all packages            |
| `npm run test`        | Run all tests                 |
| `npm run lint`        | Lint all packages             |
| `npm run typecheck`   | TypeScript check              |
| `npm run docker:up`   | Start PostgreSQL + Redis      |
| `npm run docker:down` | Stop Docker services          |

## Database Setup (Sprint 1+)

```bash
# Ensure PostgreSQL is running
npm run docker:up

# Run migrations
npm run db:migrate

# Seed admin user + categories
npm run db:seed
```

Default seed credentials (override via `.env`):

- Email: `admin@example.com`
- Password: `Admin123!`

### OpenAI article writing (Sprint 13+)

By default, article generation uses the **mock writer** (no API key required). To enable real OpenAI writing:

```bash
# In .env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini          # cost-efficient; use gpt-4o for highest quality
OPENAI_TEMPERATURE=0.45           # lower = more focused, less fluff (default 0.45)
OPENAI_MAX_COMPLETION_TOKENS=3200 # caps output cost; ~1000-1800 words (default 3200)
AI_WRITER_PROVIDER=openai         # optional; auto-detected when key is set
```

Restart the worker after changing env vars. Token usage and estimated cost are stored on each `AiJob` row.

**Idea planning (Sprint 14+):** generating an idea from a topic uses the same `OPENAI_API_KEY` and provider settings. Rich topic descriptions produce better briefs and outlines.

### Live trend discovery (Sprint 15+)

Trend discovery fetches real headlines from **Hacker News**, **Reddit**, and optionally **NewsAPI**, then matches them to your categories by keyword. Falls back to mock trends when live sources return nothing.

```bash
TREND_DISCOVERY_PROVIDER=auto   # auto | live | mock (default auto)
TREND_DISCOVERY_MAX_TOPICS=12
NEWS_API_KEY=                   # optional — https://newsapi.org
```

Trigger from admin **Topics → Discover trends** or `POST /v1/topics/discover`. Each run creates a `TREND_DISCOVERY` `AiJob` row.

**Tips for production-grade output:** put a detailed brief in the idea **Summary** (audience, angle, items to cover, tone). The writer uses title + summary + outline as input — richer briefs yield deeper articles without extra API calls.

| Script                   | Description                |
| ------------------------ | -------------------------- |
| `npm run db:migrate`     | Apply migrations           |
| `npm run db:migrate:dev` | Create new migration (dev) |
| `npm run db:seed`        | Seed admin + 7 categories  |
| `npm run db:studio`      | Open Prisma Studio         |

## API Endpoints

- `GET /v1/health` — Health check
- `POST /v1/auth/login` — Login (email/password)
- `POST /v1/auth/refresh` — Refresh access token
- `POST /v1/auth/logout` — Revoke refresh token
- `GET /v1/auth/me` — Current user (Bearer token)
- `GET /v1/categories` — List categories (`?activeOnly=true`)
- `GET /v1/categories/:slug` — Category detail with article count
- `GET /v1/articles` — List published articles (`?category=slug&page=1&limit=12`)
- `POST /v1/categories` — Create category (admin)
- `PUT /v1/categories/:id` — Update category (admin)
- `DELETE /v1/categories/:id` — Soft/hard delete category (admin)
- `GET /v1/audit-logs` — List audit logs (admin)
- `GET /v1/jobs` — List background jobs (admin)
- `POST /v1/jobs/ping` — Enqueue ping job (admin)
- `GET /v1/topics` — List trending topics (admin)
- `POST /v1/topics/discover` — Enqueue trend discovery (admin)
- `PATCH /v1/topics/:id/status` — Approve/reject/suggest topic (admin)
- `PATCH /v1/topics/:id` — Edit topic title, description, category (admin)
- `GET /v1/article-ideas` — List article ideas (`?status=DRAFT&categoryId=uuid`, admin)
- `POST /v1/article-ideas` — Create article idea (admin)
- `POST /v1/article-ideas/from-topic/:topicId` — Generate idea from topic (admin)
- `PATCH /v1/article-ideas/:id/status` — Update idea status (admin)
- `POST /v1/article-ideas/:id/generate` — Enqueue article writing job (admin)
- `GET /v1/admin/articles` — List all articles (`?status=DRAFT`, admin)
- `GET /v1/admin/articles/:id` — Article detail preview (admin)
- `PATCH /v1/admin/articles/:id/status` — Publish or archive article (admin)

## Branching & CI

| Branch        | Purpose             | Merge policy                | CI      |
| ------------- | ------------------- | --------------------------- | ------- |
| `production`  | Live default branch | Only repo admin can push    | On push |
| `staging`     | Pre-production      | Only repo admin can push    | On push |
| `development` | Integration         | PR with at least 1 approval | On push |
| `sprint-*`    | Feature work        | Open PR into `development`  | No CI   |

Flow: `sprint-*` → PR → `development` → `staging` → `production`

After cloning, apply GitHub branch protection (one-time, requires admin):

```bash
gh auth login
chmod +x .github/scripts/setup-github-governance.sh
./.github/scripts/setup-github-governance.sh
```

## Sprint Progress

- [x] Sprint 0: DevEx & CI baseline
- [x] Sprint 1: Database foundation
- [x] Sprint 2: Authentication API
- [x] Sprint 3: Categories CRUD API
- [x] Sprint 4: Public home + article listing (web)
- [x] Sprint 5: Article detail + category pages + SEO metadata
- [x] Sprint 6: Admin login UI + protected routes
- [x] Sprint 7: Admin category management UI
- [x] Sprint 8: Audit logging + admin audit viewer
- [x] Sprint 9: BullMQ infrastructure + job monitoring
- [x] Sprint 10: Trend discovery worker + topics API
- [x] Sprint 11: Article ideas API + mock generation + admin UI
- [x] Sprint 12: Mock article writing pipeline + admin articles UI
- [x] Sprint 13: OpenAI article writer with mock fallback + token/cost tracking
- [x] Sprint 14: OpenAI idea planning with mock fallback + PLANNING AiJob tracking
- [x] Sprint 15: Live trend discovery (HN, Reddit, NewsAPI) — completes **Plan Sprint 10** live fetchers
- [x] Plan Sprint 11: Topics admin UI — approve/reject/suggest, edit, status filter

## Plan alignment

We follow the [product plan](.cursor/plans/ai_publishing_platform_9e04d5dd.plan.md) (26 sprints, 1 feature per sprint). **New work uses plan sprint numbers** in PR titles: `[Plan Sprint N] feat: …`.

| Plan sprint | Plan feature                               | Status                                                |
| ----------- | ------------------------------------------ | ----------------------------------------------------- |
| 0–9         | Foundation, public web, admin core, BullMQ | ✅ Shipped (repo Sprints 0–9)                         |
| **10**      | Trend discovery (queue + live fetchers)    | ✅ Repo Sprint 10 (mock) + **15** (HN/Reddit/NewsAPI) |
| **11**      | Topics admin UI (approve/reject/edit)      | ✅ Shipped (`sprint-plan-11`)                         |
| 12–13       | Content planning + writing                 | ✅ Early (repo Sprints 11–14)                         |
| **14**      | Embeddings (pgvector)                      | ✅ Shipped (`sprint-plan-14`)                         |
| **15**      | Duplicate detection L1+L4                  | ✅ Shipped (`sprint-plan-15`)                         |
| **16**      | Duplicate detection L2+L3 + settings UI    | ✅ Shipped (`sprint-plan-16`)                         |
| **17**      | Quality validation agent                   | 🔲 **Next** — branch `sprint-plan-17`                 |
| 17–19       | Quality, SEO, automated publishing         | 🔲 Pending                                            |
| 20–25       | Search, analytics, AWS, scale              | 🔲 Pending                                            |

# AI Publishing Platform

Automated AI-powered news and article publishing platform. Discovers trends, plans ideas, writes long-form articles, validates quality, generates images, and publishes to a public website — with a full admin portal for editorial control.

## System overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Admin Portal (3007)                           │
│   Topics · Ideas · Articles · Prompts · Jobs · Categories · Audit     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST + JWT
┌───────────────────────────────▼─────────────────────────────────────────┐
│                           NestJS API (3008)                             │
│              Auth · CRUD · Search · Job enqueue · Bull Board            │
└───────┬─────────────────────────────────────────────┬─────────────────────┘
        │ Prisma                                      │ BullMQ enqueue
        ▼                                             ▼
┌───────────────┐                              ┌──────────────┐
│  PostgreSQL   │◄─────────────────────────────│    Redis     │
│  + pgvector   │         Worker consumes       │   (BullMQ)   │
└───────────────┘                              └──────┬───────┘
        ▲                                             │
        │              ┌──────────────────────────────┘
        │              ▼
        │     ┌─────────────────┐
        └─────│  Worker Service  │
              │  Job processors  │
              └────────┬─────────┘
                       │ @repo/ai (OpenAI / mock)
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Public Web (3006)                             │
│              Home · Categories · Articles · Search · SEO                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Publishing pipeline

The core workflow runs automatically (daily cron) or can be triggered step-by-step from the admin UI.

```
1. Trend Discovery
   Fetch headlines (HN, Reddit, NewsAPI) or synthesize via OpenAI
   → match to categories → TrendingTopic rows

2. Idea Planning
   Approved topic → title, summary, outline, slug, intent
   → ArticleIdea (DRAFT)

3. Content Planning
   Detailed plan with image suggestions before writing

4. Article Writing
   LLM generates 3,000+ word HTML article
   → quality gate (grammar, readability, spam, word count)
   → retry with feedback on failure (up to 3 attempts)

5. Image Enrichment
   Image suggestions → inline [IMAGE:] placeholders → DALL-E or SVG
   → featured hero image

6. SEO
   Meta title, description, OG tags, canonical URL, JSON-LD

7. Embeddings
   pgvector embeddings for similarity search and related articles

8. Publish
   Pre-publish duplicate check (title, slug, embedding, intent)
   → PUBLISHED status → visible on public web
```

Each AI step creates an `AiJob` row with provider, model, token usage, and cost tracking.

## Monorepo structure

| Path                                             | Package          | Port      | Description                    |
| ------------------------------------------------ | ---------------- | --------- | ------------------------------ |
| [apps/web](apps/web/README.md)                   | `@repo/web`      | 3006      | Public Next.js site            |
| [apps/admin](apps/admin/README.md)               | `@repo/admin`    | 3007      | Admin Next.js portal           |
| [services/api](services/api/README.md)           | `@repo/api`      | 3008      | NestJS REST API                |
| [services/worker](services/worker/README.md)     | `@repo/worker`   | —         | BullMQ job processors          |
| [packages/ai](packages/ai/README.md)             | `@repo/ai`       | —         | OpenAI + mock AI providers     |
| [packages/database](packages/database/README.md) | `@repo/database` | —         | Prisma, pipeline orchestration |
| [packages/queue](packages/queue/README.md)       | `@repo/queue`    | —         | BullMQ queue definitions       |
| [packages/shared](packages/shared/README.md)     | `@repo/shared`   | —         | Shared types and utilities     |
| [infrastructure](infrastructure/README.md)       | —                | 3009/3010 | Docker + Terraform             |

Config-only packages (`typescript-config`, `eslint-config`) are omitted — they hold shared compiler and lint settings.

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query
- **Backend:** NestJS, TypeScript, class-validator
- **Database:** PostgreSQL 16 + pgvector, Prisma
- **Queue:** BullMQ + Redis
- **AI:** OpenAI (GPT-4o, DALL-E 3, embeddings) with mock fallbacks
- **Infra:** Docker Compose (local), Terraform + ECS (AWS)
- **Monorepo:** Turborepo + npm workspaces

## Getting started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
npm run docker:up

# Copy and configure environment
cp .env.example .env

# Run database migrations and seed
npm run db:migrate
npm run db:seed

# Start all apps (web, admin, api, worker)
npm run dev
```

### Default URLs

| Service       | URL                                |
| ------------- | ---------------------------------- |
| Public web    | http://localhost:3006              |
| Admin portal  | http://localhost:3007              |
| API           | http://localhost:3008/v1           |
| Bull Board    | http://localhost:3008/admin/queues |
| Prisma Studio | `npm run db:studio`                |

### Seed credentials

Override via `.env`:

- Email: `admin@example.com`
- Password: `Admin123!`

## Environment configuration

Copy `.env.example` to `.env`. Key groups:

### Core

| Variable              | Description             |
| --------------------- | ----------------------- |
| `DATABASE_URL`        | PostgreSQL connection   |
| `REDIS_URL`           | Redis for BullMQ        |
| `JWT_SECRET`          | Auth token signing      |
| `NEXT_PUBLIC_API_URL` | API URL for frontends   |
| `CORS_ORIGIN`         | Allowed browser origins |

### OpenAI (optional — mock mode works without a key)

| Variable                | Description                        |
| ----------------------- | ---------------------------------- |
| `OPENAI_API_KEY`        | Enables real OpenAI calls          |
| `OPENAI_MODEL`          | Chat model (default `gpt-4o-mini`) |
| `AI_WRITER_PROVIDER`    | `mock` or `openai`                 |
| `AI_QUALITY_PROVIDER`   | Quality gate provider              |
| `AI_IMAGE_PROVIDER`     | Featured/inline image provider     |
| `AI_SEO_PROVIDER`       | SEO metadata provider              |
| `AI_EMBEDDING_PROVIDER` | Embedding provider                 |

### Quality thresholds

| Variable                  | Default | Description            |
| ------------------------- | ------- | ---------------------- |
| `QUALITY_MIN_WORDS`       | 3000    | Minimum article length |
| `QUALITY_MIN_GRAMMAR`     | 0.7     | Grammar score floor    |
| `QUALITY_MIN_READABILITY` | 0.55    | Readability floor      |
| `QUALITY_MAX_SPAM`        | 0.4     | Spam score ceiling     |

### Trend discovery

| Variable                     | Description                         |
| ---------------------------- | ----------------------------------- |
| `TREND_DISCOVERY_PROVIDER`   | `auto`, `live`, `mock`, or `openai` |
| `TREND_DISCOVERY_MAX_TOPICS` | Max topics per run                  |
| `NEWS_API_KEY`               | Optional NewsAPI key                |

### Article media

| Variable                        | Description                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| `ARTICLE_MEDIA_DIR`             | Local output dir (default: `apps/web/public/media/articles`) |
| `ARTICLE_MEDIA_S3_BUCKET`       | S3 bucket for production                                     |
| `ARTICLE_MEDIA_S3_PREFIX`       | S3 key prefix                                                |
| `ARTICLE_MEDIA_PUBLIC_BASE_URL` | CDN base URL                                                 |

### Worker cron

| Variable                       | Description                            |
| ------------------------------ | -------------------------------------- |
| `DAILY_PUBLISHING_CRON`        | Cron pattern (default `0 6 * * *`)     |
| `ENABLE_DAILY_PUBLISHING_CRON` | Set `false` to disable auto-scheduling |

## Scripts

| Command                  | Description                         |
| ------------------------ | ----------------------------------- |
| `npm run dev`            | Start all workspaces in development |
| `npm run build`          | Build all packages                  |
| `npm run test`           | Run all tests                       |
| `npm run lint`           | Lint all packages                   |
| `npm run typecheck`      | TypeScript check                    |
| `npm run docker:up`      | Start PostgreSQL + Redis            |
| `npm run docker:down`    | Stop Docker services                |
| `npm run db:migrate`     | Apply database migrations           |
| `npm run db:migrate:dev` | Create new migration                |
| `npm run db:seed`        | Seed admin user + categories        |
| `npm run db:studio`      | Open Prisma Studio                  |

Run a single workspace: `npm run dev --workspace=@repo/api`

## API reference

All endpoints are prefixed with `/v1`.

### Public

- `GET /health` — Health check
- `GET /categories` — List categories
- `GET /categories/:slug` — Category detail
- `GET /articles` — List published articles
- `GET /articles/:slug` — Article detail
- `GET /articles/search?q=` — Full-text search

### Auth

- `POST /auth/login` — Login
- `POST /auth/refresh` — Refresh token
- `POST /auth/logout` — Revoke refresh token
- `GET /auth/me` — Current user

### Admin (requires JWT)

- Categories, topics, article ideas, articles — full CRUD
- `POST /topics/discover` — Enqueue trend discovery
- `POST /article-ideas/:id/generate` — Enqueue article writing
- `POST /admin/publishing/trigger` — Enqueue daily pipeline
- `GET /jobs` — List background jobs
- `GET /audit-logs` — Admin audit trail
- Prompt templates, duplicate settings, dashboard metrics

See [API README](services/api/README.md) for the full module breakdown.

## AI prompts

All pipeline prompts are editable in **Admin → Prompts** and documented in [docs/ai-prompts.md](docs/ai-prompts.md).

## Branching and CI

| Branch        | Purpose        | CI                    |
| ------------- | -------------- | --------------------- |
| `production`  | Live           | On push               |
| `staging`     | Pre-production | On push               |
| `development` | Integration    | On push (PR required) |

Flow: feature branch → PR → `development` → `staging` → `production`

## Documentation index

| Document                                         | Contents                                  |
| ------------------------------------------------ | ----------------------------------------- |
| [apps/web](apps/web/README.md)                   | Public site pages, ISR, article rendering |
| [apps/admin](apps/admin/README.md)               | Admin workflows and pages                 |
| [services/api](services/api/README.md)           | NestJS modules and endpoints              |
| [services/worker](services/worker/README.md)     | Job processors and cron                   |
| [packages/ai](packages/ai/README.md)             | AI providers and prompts                  |
| [packages/database](packages/database/README.md) | Schema, pipeline, duplicates, media       |
| [packages/queue](packages/queue/README.md)       | BullMQ jobs and enqueue                   |
| [packages/shared](packages/shared/README.md)     | Shared types and utilities                |
| [infrastructure](infrastructure/README.md)       | Docker Compose and Terraform              |
| [docs/ai-prompts.md](docs/ai-prompts.md)         | Full prompt catalog                       |

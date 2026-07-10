# Background Worker (`@repo/worker`)

BullMQ worker process that executes asynchronous jobs for the AI publishing pipeline.

## Purpose

Listens on the `ai-publishing-default` queue and runs long-running tasks: trend discovery, article writing, embedding generation, and the daily publishing pipeline. The API enqueues jobs; this service processes them.

## Architecture

```
API / Cron scheduler
        ↓ enqueue
   Redis (BullMQ)
        ↓ consume
   Worker process
        ↓
   @repo/database (pipeline logic)
```

## Registered job processors

| Job name           | Processor                                  | What it does                                       |
| ------------------ | ------------------------------------------ | -------------------------------------------------- |
| `ping`             | `processors/ping.processor.ts`             | Health-check echo                                  |
| `trend-discovery`  | `processors/trend-discovery.processor.ts`  | Calls `discoverTrends()`                           |
| `article-writing`  | `processors/article-writing.processor.ts`  | Calls `generateArticle()`, then enqueues embedding |
| `embedding`        | `processors/embedding.processor.ts`        | Generates embeddings + related articles            |
| `daily-publishing` | `processors/daily-publishing.processor.ts` | Runs full daily pipeline                           |

> **Note:** Quality validation and duplicate detection run **inline** inside `generateArticle()` and `autoPublishArticle()` in `@repo/database`. The queue defines `quality` and `duplicate-check` job types for future use, but they are not processed by this worker today.

## Article writing flow (worker perspective)

```
article-writing job received
  → generateArticle(prisma, ideaId)     # write, quality gate, images, SEO
  → enqueueEmbeddingJob(articleId)      # follow-up job
embedding job received
  → generateArticleEmbeddings()
  → computeArticleRelated()
```

## Daily publishing cron

On startup (`src/main.ts`):

1. If `ENABLE_DAILY_PUBLISHING_CRON !== 'false'`, schedules a repeatable BullMQ job.
2. Default cron: `0 6 * * *` (6:00 AM daily), overridable via `DAILY_PUBLISHING_CRON`.

The daily job calls `runDailyPublishingPipeline()` which:

1. Discovers trends
2. For each active category, fills its publish quota (based on `articlesPerCycle` and `publishFrequency`)
3. Generates ideas from topics → writes articles → auto-publishes

## Entry points

| File                  | Role                                           |
| --------------------- | ---------------------------------------------- |
| `src/main.ts`         | Worker bootstrap, cron scheduling, job routing |
| `src/processors/*.ts` | Per-job handlers                               |
| `Dockerfile`          | Container image for ECS deployment             |

## Scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Run worker with ts-node (loads `../../.env`) |
| `npm run build` | Compile to `dist/`                           |
| `npm run start` | Run compiled worker                          |
| `npm run test`  | Processor unit tests                         |

From repo root: `npm run dev --workspace=@repo/worker`

**Important:** The worker must be running for enqueued jobs to process. In local dev, run API + worker together (`npm run dev` from root starts all workspaces).

## Environment variables

| Variable                          | Description                             |
| --------------------------------- | --------------------------------------- |
| `REDIS_URL`                       | Redis connection for BullMQ             |
| `DATABASE_URL`                    | PostgreSQL (via `@repo/database`)       |
| `DAILY_PUBLISHING_CRON`           | Cron pattern (default `0 6 * * *`)      |
| `ENABLE_DAILY_PUBLISHING_CRON`    | Set `false` to disable auto-scheduling  |
| `OPENAI_API_KEY`, `AI_*_PROVIDER` | AI provider selection (see root README) |

## Dependencies

- `@repo/queue` — queue connection, job types, enqueue helpers
- `@repo/database` — all pipeline orchestration

## Related docs

- [Queue package](../../packages/queue/README.md)
- [Database package](../../packages/database/README.md)
- [API service](../api/README.md)
- [Root README](../../README.md)

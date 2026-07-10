# Queue Package (`@repo/queue`)

BullMQ queue definitions, Redis connection, and job enqueue helpers.

## Purpose

Shared queue infrastructure used by both the API (to enqueue jobs) and the worker (to process them). Keeps job names, payload types, and Redis config in one place.

## Architecture

```
@repo/api  ──enqueue──→  Redis  ←──consume──  @repo/worker
                              ↑
                        @repo/queue
                     (types + helpers)
```

## Queue

| Name                    | Constant              | Description                    |
| ----------------------- | --------------------- | ------------------------------ |
| `ai-publishing-default` | `QUEUE_NAMES.DEFAULT` | Single queue for all job types |

## Job types

| Job name           | Payload         | Enqueued by                               | Processed by |
| ------------------ | --------------- | ----------------------------------------- | ------------ |
| `ping`             | `{ message }`   | API `POST /v1/jobs/ping`                  | Worker       |
| `trend-discovery`  | `{ runId }`     | API `POST /v1/topics/discover`            | Worker       |
| `article-writing`  | `{ ideaId }`    | API `POST /v1/article-ideas/:id/generate` | Worker       |
| `embedding`        | `{ articleId }` | Worker (after article writing)            | Worker       |
| `daily-publishing` | `{ runId }`     | API publishing trigger, cron scheduler    | Worker       |
| `duplicate-check`  | `{ articleId }` | _(defined, not actively enqueued)_        | —            |
| `quality`          | `{ articleId }` | _(defined, not actively enqueued)_        | —            |

Quality and duplicate checks currently run synchronously inside `@repo/database` during article generation and auto-publish.

## Key files

| File         | Role                                             |
| ------------ | ------------------------------------------------ |
| `types.ts`   | Job names, queue name, payload/result interfaces |
| `redis.ts`   | Redis connection from `REDIS_URL`                |
| `enqueue.ts` | Helper functions to add jobs                     |
| `index.ts`   | `getDefaultQueue()`, re-exports                  |

## Enqueue helpers

```typescript
enqueueEmbeddingJob(articleId)
enqueueDuplicateCheckJob(articleId)   // available but unused by worker today
enqueueDailyPublishingJob(runId?)
scheduleDailyPublishingCron(pattern)  // repeatable job for daily pipeline
```

Jobs use deterministic `jobId` values where possible (e.g. `embedding:article:{id}`) to prevent duplicates.

## Cron scheduling

`scheduleDailyPublishingCron()` is called by the worker on startup:

- Removes any existing repeatable job with the same key
- Registers a new repeatable `daily-publishing` job
- Default pattern: `0 6 * * *` (overridable via `DAILY_PUBLISHING_CRON`)

## Environment variables

| Variable    | Description                                                |
| ----------- | ---------------------------------------------------------- |
| `REDIS_URL` | Redis connection string (default `redis://localhost:3010`) |

## Dependencies

- `bullmq` — queue and worker primitives

## Consumers

- `services/api` — enqueues jobs, exposes Bull Board
- `services/worker` — processes jobs, schedules cron

## Related docs

- [Worker service](../../services/worker/README.md)
- [API service](../../services/api/README.md)
- [Root README](../../README.md)

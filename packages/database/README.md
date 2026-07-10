# Database Package (`@repo/database`)

Prisma ORM layer, PostgreSQL schema, and all AI publishing pipeline orchestration.

## Purpose

Single source of truth for data access and business logic. The API and worker both import from here rather than calling AI providers directly.

## Stack

- **PostgreSQL 16** with **pgvector** for embeddings
- **Prisma** for schema, migrations, and type-safe queries
- **@repo/ai** for LLM/embedding/image calls
- **@repo/shared** for shared types and HTML utilities

## Schema highlights

Core entities in `prisma/schema.prisma`:

| Model                | Role                                                      |
| -------------------- | --------------------------------------------------------- |
| `User`               | Admin users with roles                                    |
| `Category`           | Content verticals with publish frequency and quotas       |
| `TrendingTopic`      | Discovered trends matched to categories                   |
| `ArticleIdea`        | Editorial briefs with outline and status                  |
| `Article`            | Generated content (draft → published)                     |
| `AiJob`              | Audit trail for every AI operation (tokens, cost, status) |
| `ArticleEmbedding`   | pgvector embeddings for similarity search                 |
| `PromptTemplate`     | Editable AI prompts                                       |
| `DuplicateRejection` | Log of rejected duplicates                                |
| `PublishingJob`      | Auto-publish attempt tracking                             |
| `AuditLog`           | Admin action history                                      |

## End-to-end pipeline

```
Trend Discovery          Idea Planning           Content Planning
discover-trends.ts   →   generate-idea-from-  →  generate-content-plan.ts
                         topic.ts
        ↓
Article Writing          Quality Gate            Image Enrichment
generate-article.ts  →   validate-article-   →   generate-article-image-
                         quality.ts              suggestions.ts
                                                 generate-article-inline-
                                                 images.ts
        ↓
SEO + Featured Image     Embeddings              Duplicate Check
generate-article-seo   generate-article-      check-pre-publish.ts
generate-article-        embeddings.ts
featured-image.ts
        ↓
Publish                  Related Articles
auto-publish-article   compute-article-related.ts
```

### Stage details

**1. Trend discovery** (`discover-trends.ts`)

- Loads active categories and recent topics/articles for dedup context.
- Calls `@repo/ai` `discoverTrendContent()`.
- Upserts `TrendingTopic` rows; creates a `TREND_DISCOVERY` `AiJob`.

**2. Idea from topic** (`generate-idea-from-topic.ts`)

- Generates title, summary, outline, slug candidate, and intent from an approved topic.
- Creates `ArticleIdea` in `DRAFT` status.

**3. Content planning** (`generate-content-plan.ts`)

- Produces a detailed plan (summary, outline, image suggestions) before writing.

**4. Article generation** (`generate-article.ts`)

- Ensures content plan exists.
- Writes article via `@repo/ai` with up to 3 retry attempts on quality/word-count failure.
- Runs inline quality gate before persisting.
- Creates `Article` in `DRAFT`.
- Enriches with image suggestions, inline images, SEO, and featured image (failures are non-fatal).

**5. Embeddings** (`embedding/generate-article-embeddings.ts`)

- Embeds title + summary + content for similarity search.

**6. Auto-publish** (`publishing/auto-publish-article.ts`)

- Pre-publish duplicate check (title, slug, embedding similarity).
- SEO refresh, canonical topic registration.
- Sets status to `PUBLISHED` with timestamp.

**7. Daily pipeline** (`publishing/run-daily-pipeline.ts`)

- Runs discovery, then per-category quota filling: topic → idea → article → publish.

## Duplicate detection

Multi-layer engine in `duplicate-engine/`:

| Layer | Check                                          |
| ----- | ---------------------------------------------- |
| L1    | Exact/near title match against recent articles |
| L2    | Slug collision                                 |
| L3    | Embedding cosine similarity                    |
| L4    | Intent/topic overlap                           |

Settings are configurable via `duplicate-settings.ts` and the admin UI.

## Article media storage

`article-media.ts` saves generated images:

| Mode  | When                            | Path / URL                                                          |
| ----- | ------------------------------- | ------------------------------------------------------------------- |
| Local | `ARTICLE_MEDIA_S3_BUCKET` unset | `apps/web/public/media/articles/{slug}.ext` → `/media/articles/...` |
| S3    | Bucket configured               | Upload to S3 with optional CDN base URL                             |

Override local directory with `ARTICLE_MEDIA_DIR`.

## Search

`search-articles.ts` — PostgreSQL full-text search over published articles.

## Prompt templates

`prompt-templates/` — CRUD, defaults, and runtime resolution for all AI prompts. Admin edits persist to `PromptTemplate` rows.

## Scripts

| Command                  | Description                                |
| ------------------------ | ------------------------------------------ |
| `npm run db:migrate`     | Apply migrations (`prisma migrate deploy`) |
| `npm run db:migrate:dev` | Create migration in dev                    |
| `npm run db:seed`        | Seed admin user + categories               |
| `npm run db:studio`      | Open Prisma Studio                         |
| `npm run test`           | Integration tests (runs migrations first)  |

From repo root: `npm run db:migrate`, `npm run db:seed`, etc.

## Environment variables

| Variable                        | Description                    |
| ------------------------------- | ------------------------------ |
| `DATABASE_URL`                  | PostgreSQL connection string   |
| `ARTICLE_MEDIA_DIR`             | Local media output directory   |
| `ARTICLE_MEDIA_S3_BUCKET`       | S3 bucket for production media |
| `ARTICLE_MEDIA_S3_PREFIX`       | S3 key prefix                  |
| `ARTICLE_MEDIA_PUBLIC_BASE_URL` | CDN base URL for public media  |
| `AWS_REGION`                    | AWS region for S3              |
| All `OPENAI_*` and `AI_*` vars  | Passed through to `@repo/ai`   |

## Dependencies

- `@repo/ai` — AI provider calls
- `@repo/shared` — types, `normalizeTopicTitle`, article HTML utils

## Consumers

- `services/api` — REST endpoints
- `services/worker` — background job processors

## Related docs

- [AI package](../ai/README.md)
- [Queue package](../queue/README.md)
- [AI prompts reference](../../docs/ai-prompts.md)
- [Root README](../../README.md)

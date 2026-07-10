# AI Package (`@repo/ai`)

Provider-agnostic AI layer — OpenAI integrations with mock fallbacks for every pipeline stage.

## Purpose

Encapsulates all LLM, embedding, image generation, and quality-scoring calls. The database package orchestrates _when_ to call AI; this package handles _how_ (prompts, providers, token tracking inputs).

## Provider resolution

Each capability picks a provider based on env vars. When `OPENAI_API_KEY` is set, OpenAI is typically the default; otherwise mock implementations are used.

| Capability       | Env var                    | Mock behavior                        |
| ---------------- | -------------------------- | ------------------------------------ |
| Article writing  | `AI_WRITER_PROVIDER`       | Deterministic HTML from idea outline |
| Idea planning    | (uses writer provider)     | Template-based brief + outline       |
| Content planning | (uses writer provider)     | Structured plan from idea            |
| Trend discovery  | `TREND_DISCOVERY_PROVIDER` | Curated mock topics                  |
| Embeddings       | `AI_EMBEDDING_PROVIDER`    | Fixed-dimension mock vectors         |
| Quality gate     | `AI_QUALITY_PROVIDER`      | Rule-based pass/fail                 |
| SEO              | `AI_SEO_PROVIDER`          | Template metadata                    |
| Featured images  | `AI_IMAGE_PROVIDER`        | SVG placeholder                      |
| Inline images    | `AI_IMAGE_PROVIDER`        | SVG placeholder                      |

## Key modules

| File                           | Responsibility                                 |
| ------------------------------ | ---------------------------------------------- |
| `write-article.ts`             | Full article generation (OpenAI + mock)        |
| `generate-idea.ts`             | Idea brief and outline from a topic            |
| `generate-content-plan.ts`     | Detailed content plan before writing           |
| `discover-trends.ts`           | Trend synthesis (live feeds + OpenAI + mock)   |
| `embed-text.ts`                | Text embedding via OpenAI or mock              |
| `validate-quality.ts`          | Grammar, readability, spam, word-count scoring |
| `generate-article-seo.ts`      | Title, description, OG tags, canonical URL     |
| `article-featured-image.ts`    | DALL-E or SVG hero image                       |
| `article-inline-image.ts`      | Per-placeholder inline image generation        |
| `article-image-suggestions.ts` | Suggest images for `[IMAGE:]` slots            |
| `provider.ts`                  | Central provider/model resolution              |
| `quality-thresholds.ts`        | Env-driven quality gate thresholds             |
| `publication-writer.prompt.ts` | Default publication structure constants        |

## Prompt templates

Runtime prompts are loaded from the database (`@repo/database/prompt-templates`) and passed into AI functions. Default prompt bodies live in the database package; this package executes them.

See [docs/ai-prompts.md](../../docs/ai-prompts.md) for the full prompt catalog.

## Typical call flow (article writing)

```
resolveArticleWriterPrompts()     # from database
        ↓
writeArticleContent(input)        # OpenAI or mock
        ↓
validateArticleQuality(input)     # quality gate (may trigger rewrite)
        ↓
generateArticleSeo()              # metadata enrichment
generateFeaturedImage()           # hero image bytes
generateInlineImage()             # per-placeholder images
```

Rewrites on quality failure are handled by `@repo/database/generate-article.ts`, which calls `writeArticleContent` again with feedback.

## Environment variables

| Variable                       | Description                         |
| ------------------------------ | ----------------------------------- |
| `OPENAI_API_KEY`               | Enables real OpenAI calls           |
| `OPENAI_MODEL`                 | Chat model (default `gpt-4o-mini`)  |
| `OPENAI_TEMPERATURE`           | Sampling temperature                |
| `OPENAI_MAX_COMPLETION_TOKENS` | Output token cap                    |
| `OPENAI_EMBEDDING_MODEL`       | Embedding model                     |
| `OPENAI_IMAGE_MODEL`           | Image model (default `dall-e-3`)    |
| `AI_WRITER_PROVIDER`           | `mock` or `openai`                  |
| `AI_EMBEDDING_PROVIDER`        | `mock` or `openai`                  |
| `AI_QUALITY_PROVIDER`          | `mock` or `openai`                  |
| `AI_SEO_PROVIDER`              | `mock` or `openai`                  |
| `AI_IMAGE_PROVIDER`            | `mock` or `openai`                  |
| `TREND_DISCOVERY_PROVIDER`     | `auto`, `live`, `mock`, or `openai` |
| `TREND_DISCOVERY_MAX_TOPICS`   | Max topics per discovery run        |
| `NEWS_API_KEY`                 | Optional NewsAPI for live trends    |
| `QUALITY_MIN_GRAMMAR`          | Min grammar score (0–1)             |
| `QUALITY_MIN_READABILITY`      | Min readability score               |
| `QUALITY_MAX_SPAM`             | Max spam score                      |
| `QUALITY_MIN_WORDS`            | Min word count (default 3000)       |
| `PUBLIC_SITE_URL`              | Canonical URL base for SEO          |

## Scripts

| Command         | Description        |
| --------------- | ------------------ |
| `npm run build` | Compile TypeScript |
| `npm run test`  | Unit tests         |

## Dependencies

- `@repo/shared` — shared types (`ArticleImageSuggestion`, etc.)

## Consumers

- `@repo/database` — primary consumer; orchestrates all pipeline stages
- Integration tests in `packages/database/test/`

## Related docs

- [Database package](../database/README.md)
- [AI prompts reference](../../docs/ai-prompts.md)
- [Root README](../../README.md)

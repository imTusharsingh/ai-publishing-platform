# Shared Package (`@repo/shared`)

Cross-cutting TypeScript types, API contracts, and utilities shared across apps and services.

## Purpose

Prevents type drift between the NestJS API, Next.js frontends, and database package. When an API response shape changes, update it here and all consumers get compile-time errors.

## Exports

### App constants

- `PUBLIC_APP_NAME` — "AuraNews"
- `ADMIN_APP_NAME` — "Aura Admin"

### API contracts (`*.types.ts`)

| File                        | Types                                                           |
| --------------------------- | --------------------------------------------------------------- |
| `auth.types.ts`             | `AuthUser`, `AuthTokens`, `LoginRequest`, `AuthMeResponse`      |
| `api.types.ts`              | Public article/category list and detail responses, search types |
| `admin.types.ts`            | Category admin CRUD, audit logs, job status                     |
| `articles-admin.types.ts`   | Admin article list, detail, status updates                      |
| `article-ideas.types.ts`    | Idea summaries, content plans, image suggestions                |
| `trends.types.ts`           | Topic summaries, statuses, mock trend fixtures                  |
| `prompt-templates.types.ts` | Prompt catalog metadata, section labels, variable hints         |

### Article HTML utilities (`article-html.ts`)

Shared between the database pipeline and the public web renderer:

- `replaceArticleImagePlaceholders()` — `[IMAGE:]` → `<figure>` or placeholder block
- `buildInlineImageFigure()` — structured image HTML
- `parseImageSuggestions()` — extract suggestions from structured data
- `escapeArticleHtml()` — safe HTML escaping
- `countArticleImagePlaceholders()` — count `[IMAGE:]` markers

### Prompt rendering

- `renderPromptTemplate()` — `{{variable}}` substitution for AI prompts

### Design tokens

- `auraColors`, `auraSpacing`, `auraFontSize`, `auraTailwindTheme` — shared Tailwind theme values

### Utilities

- `formatApiVersion()` — version string helper
- `normalizeTopicTitle()` — consistent topic title normalization
- `MOCK_TREND_BATCH` — test fixtures for trend discovery

## Who imports what

| Consumer            | Typical imports                                     |
| ------------------- | --------------------------------------------------- |
| `apps/web`          | `api.types`, `article-html`                         |
| `apps/admin`        | All admin/topic/idea/prompt types, `auth.types`     |
| `services/api`      | Types for response DTOs (via re-export or direct)   |
| `packages/database` | `normalizeTopicTitle`, `article-html`, prompt types |
| `packages/ai`       | `ArticleImageSuggestion` and related types          |

## Scripts

| Command         | Description        |
| --------------- | ------------------ |
| `npm run build` | Compile TypeScript |
| `npm run test`  | Unit tests         |

## Dependencies

None — this is a leaf package with no workspace dependencies.

## Related docs

- [API service](../../services/api/README.md)
- [Web app](../../apps/web/README.md)
- [Admin portal](../../apps/admin/README.md)
- [Root README](../../README.md)

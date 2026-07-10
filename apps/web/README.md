# Public Web (`@repo/web`)

Next.js 15 public site for **AuraNews** — the reader-facing front door for published articles, categories, and search.

## Purpose

Renders published content from the REST API with ISR (60s revalidation), SEO metadata, sitemaps, and article HTML that supports inline image placeholders and featured images.

## Architecture

```
Browser → Next.js App Router (port 3006)
              ↓ fetch (ISR)
         NestJS API /v1 (port 3008)
```

The web app does **not** talk to the database or queue directly. All data comes from `NEXT_PUBLIC_API_URL`.

## Key workflows

### Home and category browsing

1. `app/page.tsx` loads categories and latest articles via `lib/api.ts`.
2. `app/category/[slug]/page.tsx` lists articles for a category with pagination.
3. `app/category/[slug]/intro/page.tsx` shows category intro copy when configured.

### Article detail

1. `app/articles/[slug]/page.tsx` fetches article detail from `GET /v1/articles/:slug`.
2. `generateMetadata` builds title, description, Open Graph, and canonical URL from SEO fields.
3. `components/article-detail-view.tsx` renders HTML content.
4. `lib/article-content.ts` transforms stored HTML:
   - `[IMAGE:]` placeholders → styled blocks or real `<img>` when a URL exists
   - Uses shared utilities from `@repo/shared/article-html`

### Search

1. `app/search/page.tsx` calls `lib/search-api.ts` → `GET /v1/articles/search`.
2. Full-text search is powered by PostgreSQL on the API/database side.

### SEO

- `app/sitemap.ts` — dynamic sitemap from published articles and categories.
- `app/robots.ts` — crawl rules.
- Per-page `generateMetadata` on article and category routes.

## Directory layout

```
app/                  App Router pages (home, articles, categories, search)
components/           UI components (article cards, layout, search)
lib/
  api.ts              Public API client (categories, articles)
  search-api.ts       Search API client
  article-content.ts  HTML/image placeholder rendering
public/media/articles Generated article images (local dev fallback)
```

## Scripts

| Command            | Description                 |
| ------------------ | --------------------------- |
| `npm run dev`      | Dev server on port **3006** |
| `npm run build`    | Production build            |
| `npm run test`     | Jest unit tests             |
| `npm run test:e2e` | Playwright E2E tests        |

From repo root: `npm run dev --workspace=@repo/web`

## Environment variables

| Variable              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | API base URL (default `http://localhost:3008`) |

## Dependencies

- `@repo/shared` — API response types, article HTML utilities, design tokens
- NestJS API — all data

## Related docs

- [API service](../../services/api/README.md)
- [Database package](../../packages/database/README.md) — article media storage
- [Root README](../../README.md)

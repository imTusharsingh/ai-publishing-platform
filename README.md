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

| Script                   | Description                |
| ------------------------ | -------------------------- |
| `npm run db:migrate`     | Apply migrations           |
| `npm run db:migrate:dev` | Create new migration (dev) |
| `npm run db:seed`        | Seed admin + 7 categories  |
| `npm run db:studio`      | Open Prisma Studio         |

## API Endpoints (Sprint 0)

- `GET /v1/health` — Health check

## Sprint Progress

- [x] Sprint 0: DevEx & CI baseline
- [x] Sprint 1: Database foundation
- [ ] Sprint 2: Authentication API

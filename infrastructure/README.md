# Infrastructure

Local development services and AWS deployment resources.

## Purpose

- **Docker Compose** — PostgreSQL (with pgvector) and Redis for local development.
- **Terraform** — AWS staging/production stack (VPC, RDS, ElastiCache, S3, ECS).

## Local development (Docker)

File: `docker/docker-compose.yml`

| Service    | Image                    | Host port       | Purpose                                    |
| ---------- | ------------------------ | --------------- | ------------------------------------------ |
| `postgres` | `pgvector/pgvector:pg16` | **3009** → 5432 | Application database with vector extension |
| `redis`    | `redis:7-alpine`         | **3010** → 6379 | BullMQ job queue                           |

### Commands

From repo root:

```bash
npm run docker:up      # Start containers
npm run docker:down    # Stop containers
```

Connection strings (see `.env.example`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:3009/ai_publishing
REDIS_URL=redis://localhost:3010
```

Data persists in Docker volumes (`postgres_data`, `redis_data`).

## AWS (Terraform)

Directory: `terraform/`

### Modules

| Module        | Resources                                    |
| ------------- | -------------------------------------------- |
| `vpc`         | VPC, subnets, routing                        |
| `rds`         | PostgreSQL RDS instance, connection secret   |
| `elasticache` | Redis cluster for BullMQ                     |
| `s3`          | Assets bucket for article media              |
| `ecs`         | Fargate services for API, worker, web, admin |

### State backend

Terraform state is stored in S3:

```
Bucket: ai-publishing-terraform-state
Key:    staging/terraform.tfstate
Region: us-east-1
```

### Usage

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="environment=staging"
terraform apply -var="environment=staging"
```

Variables are defined in `variables.tf`. Module outputs (connection strings, bucket names) are in `outputs.tf`.

### Validation

```bash
./infrastructure/scripts/validate-terraform.sh
```

## Container images

Each deployable service has a `Dockerfile`:

| Service | Path                         |
| ------- | ---------------------------- |
| API     | `services/api/Dockerfile`    |
| Worker  | `services/worker/Dockerfile` |
| Web     | `apps/web/Dockerfile`        |
| Admin   | `apps/admin/Dockerfile`      |

ECS task definitions in `terraform/modules/ecs/` wire these images with environment secrets from RDS and ElastiCache.

## Production media (S3)

When deployed to AWS, set on the worker/API:

```
ARTICLE_MEDIA_S3_BUCKET=<assets bucket from terraform>
ARTICLE_MEDIA_S3_PREFIX=media/articles
ARTICLE_MEDIA_PUBLIC_BASE_URL=<CloudFront URL if configured>
```

See [database package README](../packages/database/README.md#article-media-storage) for local vs S3 behavior.

## Related docs

- [Root README](../README.md)
- [API service](../services/api/README.md)
- [Worker service](../services/worker/README.md)

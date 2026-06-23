-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'EDITOR', 'VIEWER');
-- CreateEnum
CREATE TYPE "PublishFrequency" AS ENUM ('DAILY', 'TWICE_DAILY', 'WEEKLY');
-- CreateEnum
CREATE TYPE "TrendSource" AS ENUM ('GOOGLE_TRENDS', 'REDDIT', 'TWITTER', 'NEWS_API', 'BLOG_RSS');
-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('DISCOVERED', 'SUGGESTED', 'APPROVED', 'REJECTED', 'USED', 'EXPIRED');
-- CreateEnum
CREATE TYPE "ArticleIdeaStatus" AS ENUM ('DRAFT', 'DUPLICATE_REJECTED', 'APPROVED', 'GENERATING', 'FAILED');
-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
-- CreateEnum
CREATE TYPE "PublishingJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'PUBLISHED', 'FAILED');
-- CreateEnum
CREATE TYPE "AiJobType" AS ENUM ('TREND_DISCOVERY', 'PLANNING', 'WRITING', 'SEO', 'QUALITY', 'DUPLICATE', 'EMBEDDING');
-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "keywords" TEXT[],
    "priority_score" SMALLINT NOT NULL DEFAULT 50,
    "publish_frequency" "PublishFrequency" NOT NULL DEFAULT 'DAILY',
    "articles_per_cycle" SMALLINT NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "trending_topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source" "TrendSource" NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "normalized_title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "popularity_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "source_url" TEXT,
    "source_metadata" JSONB,
    "matched_category_id" UUID,
    "status" "TopicStatus" NOT NULL DEFAULT 'DISCOVERED',
    "discovered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    CONSTRAINT "trending_topics_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "canonical_topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_key" VARCHAR(200) NOT NULL,
    "intent" VARCHAR(100) NOT NULL,
    "keywords" TEXT[],
    "embedding" vector(1536),
    "first_covered_at" TIMESTAMPTZ NOT NULL,
    "last_covered_at" TIMESTAMPTZ NOT NULL,
    "coverage_count" INTEGER NOT NULL DEFAULT 1,
    "cooldown_until" TIMESTAMPTZ NOT NULL,
    "article_id" UUID NOT NULL,
    CONSTRAINT "canonical_topics_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "article_ideas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "trending_topic_id" UUID,
    "title" VARCHAR(500) NOT NULL,
    "slug_candidate" VARCHAR(520) NOT NULL,
    "summary" TEXT,
    "outline" JSONB,
    "intent" VARCHAR(100),
    "status" "ArticleIdeaStatus" NOT NULL DEFAULT 'DRAFT',
    "duplicate_check_result" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_ideas_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "article_idea_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(520) NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "content_plain" TEXT,
    "featured_image_url" TEXT,
    "author_name" VARCHAR(100) NOT NULL DEFAULT 'AI Writer',
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "seo_title" VARCHAR(70),
    "seo_description" VARCHAR(160),
    "canonical_url" TEXT,
    "og_image_url" TEXT,
    "structured_data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "article_embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "title_embedding" vector(1536),
    "summary_embedding" vector(1536),
    "content_embedding" vector(1536),
    "model" VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_embeddings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "article_related" (
    "article_id" UUID NOT NULL,
    "related_article_id" UUID NOT NULL,
    "similarity_score" DECIMAL(5,4) NOT NULL,
    CONSTRAINT "article_related_pkey" PRIMARY KEY ("article_id","related_article_id")
);
-- CreateTable
CREATE TABLE "publishing_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "status" "PublishingJobStatus" NOT NULL DEFAULT 'QUEUED',
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "published_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "retry_count" SMALLINT NOT NULL DEFAULT 0,
    "bullmq_job_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "publishing_jobs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_type" "AiJobType" NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'PENDING',
    "provider" VARCHAR(50) NOT NULL DEFAULT 'openai',
    "model" VARCHAR(100),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "cost_usd" DECIMAL(10,6),
    "input_snapshot" JSONB,
    "output_snapshot" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "duplicate_rejections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rejected_title" VARCHAR(500) NOT NULL,
    "rejected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "layer" SMALLINT NOT NULL,
    "matched_article_id" UUID,
    "similarity_score" DECIMAL(5,4),
    "reason" TEXT,
    "metadata" JSONB,
    CONSTRAINT "duplicate_rejections_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
-- CreateIndex
CREATE INDEX "categories_is_active_priority_score_idx" ON "categories"("is_active", "priority_score" DESC);
-- CreateIndex
CREATE INDEX "trending_topics_status_popularity_score_idx" ON "trending_topics"("status", "popularity_score" DESC);
-- CreateIndex
CREATE INDEX "trending_topics_matched_category_id_idx" ON "trending_topics"("matched_category_id");
-- CreateIndex
CREATE UNIQUE INDEX "canonical_topics_topic_key_key" ON "canonical_topics"("topic_key");
-- CreateIndex
CREATE INDEX "canonical_topics_intent_idx" ON "canonical_topics"("intent");
-- CreateIndex
CREATE INDEX "canonical_topics_cooldown_until_idx" ON "canonical_topics"("cooldown_until");
-- CreateIndex
CREATE UNIQUE INDEX "article_ideas_slug_candidate_key" ON "article_ideas"("slug_candidate");
-- CreateIndex
CREATE INDEX "article_ideas_status_idx" ON "article_ideas"("status");
-- CreateIndex
CREATE INDEX "article_ideas_category_id_idx" ON "article_ideas"("category_id");
-- CreateIndex
CREATE UNIQUE INDEX "articles_article_idea_id_key" ON "articles"("article_idea_id");
-- CreateIndex
CREATE UNIQUE INDEX "articles_title_key" ON "articles"("title");
-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
-- CreateIndex
CREATE INDEX "articles_status_published_at_idx" ON "articles"("status", "published_at" DESC);
-- CreateIndex
CREATE INDEX "articles_category_id_status_published_at_idx" ON "articles"("category_id", "status", "published_at" DESC);
-- CreateIndex
CREATE UNIQUE INDEX "article_embeddings_article_id_key" ON "article_embeddings"("article_id");
-- CreateIndex
CREATE INDEX "publishing_jobs_status_scheduled_at_idx" ON "publishing_jobs"("status", "scheduled_at");
-- CreateIndex
CREATE INDEX "ai_jobs_job_type_status_idx" ON "ai_jobs"("job_type", "status");
-- CreateIndex
CREATE INDEX "ai_jobs_entity_type_entity_id_idx" ON "ai_jobs"("entity_type", "entity_id");
-- CreateIndex
CREATE INDEX "duplicate_rejections_rejected_at_idx" ON "duplicate_rejections"("rejected_at" DESC);
-- CreateIndex
CREATE INDEX "duplicate_rejections_layer_idx" ON "duplicate_rejections"("layer");
-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);
-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "trending_topics" ADD CONSTRAINT "trending_topics_matched_category_id_fkey" FOREIGN KEY ("matched_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "trending_topics" ADD CONSTRAINT "trending_topics_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "canonical_topics" ADD CONSTRAINT "canonical_topics_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "article_ideas" ADD CONSTRAINT "article_ideas_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "article_ideas" ADD CONSTRAINT "article_ideas_trending_topic_id_fkey" FOREIGN KEY ("trending_topic_id") REFERENCES "trending_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_article_idea_id_fkey" FOREIGN KEY ("article_idea_id") REFERENCES "article_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "article_embeddings" ADD CONSTRAINT "article_embeddings_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "article_related" ADD CONSTRAINT "article_related_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "article_related" ADD CONSTRAINT "article_related_related_article_id_fkey" FOREIGN KEY ("related_article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "publishing_jobs" ADD CONSTRAINT "publishing_jobs_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "duplicate_rejections" ADD CONSTRAINT "duplicate_rejections_matched_article_id_fkey" FOREIGN KEY ("matched_article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

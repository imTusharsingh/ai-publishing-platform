CREATE TABLE "prompt_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT[],
    "category_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prompt_templates_key_category_id_key" ON "prompt_templates"("key", "category_id");
CREATE UNIQUE INDEX "prompt_templates_key_global_unique" ON "prompt_templates"("key") WHERE "category_id" IS NULL;
CREATE INDEX "prompt_templates_key_is_active_idx" ON "prompt_templates"("key", "is_active");

ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

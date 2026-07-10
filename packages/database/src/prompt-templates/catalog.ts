import { PrismaClient } from '@prisma/client';
import { renderPromptTemplate } from '@repo/shared';
import {
  PROMPT_TEMPLATE_SECTIONS,
  type PromptCatalogPrompt,
  type PromptCatalogResponse,
  type PromptCatalogSection,
  type PromptTemplateKey,
} from '@repo/shared';
import { resolveQualityThresholds } from '@repo/ai';
import { DEFAULT_PROMPT_DEFINITIONS, getDefaultPromptDefinition } from './defaults';
import type { PromptTemplateRecord } from './index';

interface PromptRow {
  id: string;
  key: string;
  name: string;
  body: string;
  variables: string[];
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
}

async function listPromptRows(prisma: PrismaClient): Promise<PromptRow[]> {
  const rows = await prisma.promptTemplate.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ key: 'asc' }, { categoryId: { sort: 'asc', nulls: 'first' } }],
  });

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    body: row.body,
    variables: row.variables,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    isActive: row.isActive,
  }));
}

function matchesScope(row: PromptRow, categoryId?: string | null): boolean {
  if (categoryId) {
    return row.categoryId === categoryId;
  }
  return row.categoryId === null;
}

export async function getPromptCatalog(
  prisma: PrismaClient,
  categoryId?: string | null,
): Promise<PromptCatalogResponse> {
  const rows = await listPromptRows(prisma);

  const sections: PromptCatalogSection[] = PROMPT_TEMPLATE_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    prompts: section.promptKeys.map((key) => {
      const definition = DEFAULT_PROMPT_DEFINITIONS[key];
      const row = rows.find((entry) => entry.key === key && matchesScope(entry, categoryId));

      const effectiveBody = row?.body ?? definition.body;
      const isCustomized = Boolean(row && row.body !== definition.body);

      return {
        key,
        name: definition.name,
        description: definition.description,
        variables: definition.variables,
        defaultBody: definition.body,
        effectiveBody,
        dbId: row?.id ?? null,
        isCustomized,
        categoryId: row?.categoryId ?? categoryId ?? null,
        categoryName: row?.categoryName ?? null,
      } satisfies PromptCatalogPrompt;
    }),
  }));

  return { sections };
}

export async function savePromptByKey(
  prisma: PrismaClient,
  key: string,
  body: string,
  categoryId?: string | null,
): Promise<PromptTemplateRecord> {
  const definition = getDefaultPromptDefinition(key);
  if (!definition) {
    throw new Error(`No prompt definition found for key "${key}"`);
  }

  const scopeCategoryId = categoryId ?? null;
  const existing = await prisma.promptTemplate.findFirst({
    where: { key, categoryId: scopeCategoryId },
    include: { category: { select: { name: true } } },
  });

  if (existing) {
    const row = await prisma.promptTemplate.update({
      where: { id: existing.id },
      data: { body, isActive: true },
      include: { category: { select: { name: true } } },
    });

    return {
      id: row.id,
      key: row.key,
      name: row.name,
      body: row.body,
      variables: row.variables,
      categoryId: row.categoryId,
      categoryName: row.category?.name ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  const row = await prisma.promptTemplate.create({
    data: {
      key,
      name: definition.name,
      body,
      variables: definition.variables,
      categoryId: scopeCategoryId,
      isActive: true,
    },
    include: { category: { select: { name: true } } },
  });

  return {
    id: row.id,
    key: row.key,
    name: row.name,
    body: row.body,
    variables: row.variables,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function resetPromptByKey(
  prisma: PrismaClient,
  key: string,
  categoryId?: string | null,
): Promise<PromptTemplateRecord | null> {
  const definition = getDefaultPromptDefinition(key);
  if (!definition) {
    throw new Error(`No prompt definition found for key "${key}"`);
  }

  const scopeCategoryId = categoryId ?? null;
  const existing = await prisma.promptTemplate.findFirst({
    where: { key, categoryId: scopeCategoryId },
  });

  if (!existing) {
    return null;
  }

  const row = await prisma.promptTemplate.update({
    where: { id: existing.id },
    data: {
      name: definition.name,
      body: definition.body,
      variables: definition.variables,
      isActive: true,
    },
    include: { category: { select: { name: true } } },
  });

  return {
    id: row.id,
    key: row.key,
    name: row.name,
    body: row.body,
    variables: row.variables,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getResolvedPromptBodies(
  prisma: PrismaClient,
  keys: PromptTemplateKey[],
  categoryId?: string | null,
): Promise<Record<PromptTemplateKey, string>> {
  const catalog = await getPromptCatalog(prisma, categoryId);
  const result = {} as Record<PromptTemplateKey, string>;

  for (const section of catalog.sections) {
    for (const prompt of section.prompts) {
      if (keys.includes(prompt.key)) {
        result[prompt.key] = prompt.effectiveBody;
      }
    }
  }

  return result;
}

export async function resolveArticleWriterPrompts(
  prisma: PrismaClient,
  categoryId?: string | null,
) {
  const bodies = await getResolvedPromptBodies(
    prisma,
    [
      'article_writer_system',
      'article_writer_user',
      'article_explainer_format',
      'article_listicle_format',
      'article_quality_contract',
    ],
    categoryId,
  );
  const thresholds = resolveQualityThresholds();

  return {
    systemPrompt: bodies.article_writer_system,
    userPromptTemplate: bodies.article_writer_user,
    explainerFormat: bodies.article_explainer_format,
    listicleFormat: bodies.article_listicle_format,
    qualityContract: renderPromptTemplate(bodies.article_quality_contract, {
      minWordCount: String(thresholds.minWordCount),
    }),
  };
}

export async function resolveIdeaPlanningPrompts(prisma: PrismaClient, categoryId?: string | null) {
  const bodies = await getResolvedPromptBodies(
    prisma,
    ['idea_planning_system', 'idea_planning_user'],
    categoryId,
  );

  return {
    systemPrompt: bodies.idea_planning_system,
    userPromptTemplate: bodies.idea_planning_user,
  };
}

export async function resolveContentPlanningPrompts(
  prisma: PrismaClient,
  categoryId?: string | null,
) {
  const bodies = await getResolvedPromptBodies(
    prisma,
    ['content_planning_system', 'content_planning_user'],
    categoryId,
  );

  return {
    systemPrompt: bodies.content_planning_system,
    userPromptTemplate: bodies.content_planning_user,
  };
}

export async function resolveTrendDiscoveryPrompts(
  prisma: PrismaClient,
  categoryId?: string | null,
) {
  const bodies = await getResolvedPromptBodies(
    prisma,
    ['trend_discovery_system', 'trend_discovery_user'],
    categoryId,
  );

  return {
    systemPrompt: bodies.trend_discovery_system,
    userPromptTemplate: bodies.trend_discovery_user,
  };
}

export async function resolveQualityScoringPrompts(
  prisma: PrismaClient,
  categoryId?: string | null,
) {
  const bodies = await getResolvedPromptBodies(
    prisma,
    ['quality_scoring_system', 'quality_scoring_user'],
    categoryId,
  );

  return {
    systemPrompt: bodies.quality_scoring_system,
    userPromptTemplate: bodies.quality_scoring_user,
  };
}

export async function resolveSeoGenerationPrompts(
  prisma: PrismaClient,
  categoryId?: string | null,
) {
  const bodies = await getResolvedPromptBodies(
    prisma,
    ['seo_generation_system', 'seo_generation_user'],
    categoryId,
  );

  return {
    systemPrompt: bodies.seo_generation_system,
    userPromptTemplate: bodies.seo_generation_user,
  };
}

export async function resolveFeaturedImagePrompt(
  prisma: PrismaClient,
  variables: Record<string, string | null | undefined>,
  categoryId?: string | null,
) {
  const bodies = await getResolvedPromptBodies(prisma, ['featured_image'], categoryId);
  return renderPromptTemplate(bodies.featured_image, variables);
}

export async function resolveArticleImageSuggestionPrompts(
  prisma: PrismaClient,
  categoryId?: string | null,
) {
  const bodies = await getResolvedPromptBodies(
    prisma,
    ['article_image_generator', 'article_image_generator_user'],
    categoryId,
  );

  return {
    systemPrompt: bodies.article_image_generator,
    userPromptTemplate: bodies.article_image_generator_user,
  };
}

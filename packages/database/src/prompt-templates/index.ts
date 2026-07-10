import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_PROMPT_DEFINITIONS, getDefaultPromptDefinition } from './defaults';
import { renderPromptTemplate } from '@repo/shared';

export {
  PROMPT_TEMPLATE_KEYS,
  DEFAULT_FEATURED_IMAGE_PROMPT,
  DEFAULT_PROMPT_DEFINITIONS,
  getDefaultPromptDefinition,
} from './defaults';
export type { DefaultPromptDefinition, PromptTemplateKey } from './defaults';
export { renderPromptTemplate } from '@repo/shared';
export {
  getPromptCatalog,
  savePromptByKey,
  resetPromptByKey,
  getResolvedPromptBodies,
  resolveArticleWriterPrompts,
  resolveIdeaPlanningPrompts,
  resolveContentPlanningPrompts,
  resolveTrendDiscoveryPrompts,
  resolveQualityScoringPrompts,
  resolveSeoGenerationPrompts,
  resolveFeaturedImagePrompt,
  resolveArticleImageSuggestionPrompts,
} from './catalog';

export interface PromptTemplateRecord {
  id: string;
  key: string;
  name: string;
  body: string;
  variables: string[];
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPromptTemplateInput {
  key: string;
  name: string;
  body: string;
  variables: string[];
  categoryId?: string | null;
  isActive?: boolean;
}

function toRecord(row: {
  id: string;
  key: string;
  name: string;
  body: string;
  variables: string[];
  categoryId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: { name: string } | null;
}): PromptTemplateRecord {
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

const includeCategory = { category: { select: { name: true } } } as const;

export async function resolvePromptTemplate(
  prisma: PrismaClient,
  key: string,
  variables: Record<string, string | null | undefined>,
  categoryId?: string | null,
): Promise<string> {
  if (categoryId) {
    const categoryPrompt = await prisma.promptTemplate.findFirst({
      where: { key, categoryId, isActive: true },
      select: { body: true },
    });
    if (categoryPrompt) {
      return renderPromptTemplate(categoryPrompt.body, variables);
    }
  }

  const globalPrompt = await prisma.promptTemplate.findFirst({
    where: { key, categoryId: null, isActive: true },
    select: { body: true },
  });
  if (globalPrompt) {
    return renderPromptTemplate(globalPrompt.body, variables);
  }

  const fallback = getDefaultPromptDefinition(key);
  if (fallback) {
    return renderPromptTemplate(fallback.body, variables);
  }

  throw new Error(`No prompt template found for key "${key}"`);
}

export async function listPromptTemplates(
  prisma: PrismaClient,
  key?: string,
): Promise<PromptTemplateRecord[]> {
  const rows = await prisma.promptTemplate.findMany({
    where: key ? { key } : undefined,
    include: includeCategory,
    orderBy: [{ key: 'asc' }, { categoryId: { sort: 'asc', nulls: 'first' } }],
  });

  return rows.map(toRecord);
}

export async function getPromptTemplateById(
  prisma: PrismaClient,
  id: string,
): Promise<PromptTemplateRecord | null> {
  const row = await prisma.promptTemplate.findUnique({
    where: { id },
    include: includeCategory,
  });

  return row ? toRecord(row) : null;
}

async function assertUniqueScope(
  prisma: PrismaClient,
  key: string,
  categoryId: string | null | undefined,
  excludeId?: string,
): Promise<void> {
  const existing = await prisma.promptTemplate.findFirst({
    where: {
      key,
      categoryId: categoryId ?? null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    const scope = categoryId ? 'this category' : 'the global default';
    throw new Error(`A prompt template already exists for key "${key}" on ${scope}`);
  }
}

export async function upsertPromptTemplate(
  prisma: PrismaClient,
  input: UpsertPromptTemplateInput,
): Promise<PromptTemplateRecord> {
  const categoryId = input.categoryId ?? null;
  await assertUniqueScope(prisma, input.key, categoryId);

  const row = await prisma.promptTemplate.create({
    data: {
      key: input.key,
      name: input.name,
      body: input.body,
      variables: input.variables,
      categoryId,
      isActive: input.isActive ?? true,
    },
    include: includeCategory,
  });

  return toRecord(row);
}

export async function updatePromptTemplate(
  prisma: PrismaClient,
  id: string,
  input: Partial<UpsertPromptTemplateInput>,
): Promise<PromptTemplateRecord> {
  const existing = await prisma.promptTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Prompt template with id "${id}" not found`);
  }

  const nextCategoryId =
    input.categoryId !== undefined ? (input.categoryId ?? null) : existing.categoryId;
  const nextKey = input.key ?? existing.key;

  if (nextKey !== existing.key || nextCategoryId !== existing.categoryId) {
    await assertUniqueScope(prisma, nextKey, nextCategoryId, id);
  }

  const row = await prisma.promptTemplate.update({
    where: { id },
    data: {
      key: input.key,
      name: input.name,
      body: input.body,
      variables: input.variables,
      categoryId: input.categoryId !== undefined ? (input.categoryId ?? null) : undefined,
      isActive: input.isActive,
    },
    include: includeCategory,
  });

  return toRecord(row);
}

export async function deletePromptTemplate(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.promptTemplate.delete({ where: { id } });
}

export async function ensureDefaultPromptTemplates(prisma: PrismaClient): Promise<void> {
  for (const definition of Object.values(DEFAULT_PROMPT_DEFINITIONS)) {
    const existing = await prisma.promptTemplate.findFirst({
      where: { key: definition.key, categoryId: null },
    });

    if (!existing) {
      await prisma.promptTemplate.create({
        data: {
          key: definition.key,
          name: definition.name,
          body: definition.body,
          variables: definition.variables,
        },
      });
    }
  }
}

export async function resetPromptTemplateToDefault(
  prisma: PrismaClient,
  id: string,
): Promise<PromptTemplateRecord> {
  const existing = await prisma.promptTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Prompt template with id "${id}" not found`);
  }

  const fallback = getDefaultPromptDefinition(existing.key);
  if (!fallback) {
    throw new Error(`No built-in default exists for key "${existing.key}"`);
  }

  const row = await prisma.promptTemplate.update({
    where: { id },
    data: {
      name: fallback.name,
      body: fallback.body,
      variables: fallback.variables,
    },
    include: includeCategory,
  });

  return toRecord(row);
}

export type { Prisma };

import { PrismaClient } from '@prisma/client';

const MAX_TITLE_LENGTH = 500;
const MAX_SLUG_LENGTH = 520;

export async function resolveUniqueArticleTitle(
  prisma: PrismaClient,
  baseTitle: string,
): Promise<string> {
  const trimmedBase = baseTitle.trim().slice(0, MAX_TITLE_LENGTH);
  let title = trimmedBase || 'Untitled article';
  let suffix = 2;

  while (await prisma.article.findFirst({ where: { title }, select: { id: true } })) {
    const suffixText = ` (${suffix})`;
    const base = trimmedBase.slice(0, Math.max(1, MAX_TITLE_LENGTH - suffixText.length));
    title = `${base}${suffixText}`;
    suffix += 1;
  }

  return title;
}

export async function resolveUniqueArticleSlug(
  prisma: PrismaClient,
  baseSlug: string,
): Promise<string> {
  const trimmedBase = baseSlug.trim().slice(0, MAX_SLUG_LENGTH);
  let slug = trimmedBase || 'article';
  let suffix = 2;

  while (await prisma.article.findFirst({ where: { slug }, select: { id: true } })) {
    const suffixText = `-${suffix}`;
    const base = trimmedBase.slice(0, Math.max(1, MAX_SLUG_LENGTH - suffixText.length));
    slug = `${base}${suffixText}`;
    suffix += 1;
  }

  return slug;
}

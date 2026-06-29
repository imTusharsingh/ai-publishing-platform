import { PrismaClient } from '@prisma/client';

export function slugifyIdeaTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function resolveUniqueIdeaSlug(prisma: PrismaClient, title: string): Promise<string> {
  const baseSlug = slugifyIdeaTitle(title) || 'article-idea';
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.articleIdea.findUnique({ where: { slugCandidate: slug } })) {
    const trimmedBase = baseSlug.slice(0, Math.max(1, 120 - `-${suffix}`.length));
    slug = `${trimmedBase}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

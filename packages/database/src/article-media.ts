import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type ArticleMediaExtension = 'svg' | 'png' | 'jpg' | 'webp';

export function getArticleMediaDirectory(): string {
  const fromEnv = process.env.ARTICLE_MEDIA_DIR?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  return path.join(__dirname, '../../../apps/web/public/media/articles');
}

export function buildFeaturedImagePublicPath(
  slug: string,
  extension: ArticleMediaExtension,
): string {
  return `/media/articles/${slug}.${extension}`;
}

export function buildInlineImagePublicPath(
  slug: string,
  index: number,
  extension: ArticleMediaExtension,
): string {
  return `/media/articles/${slug}-inline-${index}.${extension}`;
}

export async function saveArticleMediaFile(
  slug: string,
  data: Buffer | string,
  extension: ArticleMediaExtension,
): Promise<string> {
  const directory = getArticleMediaDirectory();
  await mkdir(directory, { recursive: true });

  const filename = `${slug}.${extension}`;
  await writeFile(path.join(directory, filename), data);

  return buildFeaturedImagePublicPath(slug, extension);
}

export async function saveInlineArticleMediaFile(
  slug: string,
  index: number,
  data: Buffer | string,
  extension: ArticleMediaExtension,
): Promise<string> {
  const directory = getArticleMediaDirectory();
  await mkdir(directory, { recursive: true });

  const filename = `${slug}-inline-${index}.${extension}`;
  await writeFile(path.join(directory, filename), data);

  return buildInlineImagePublicPath(slug, index, extension);
}

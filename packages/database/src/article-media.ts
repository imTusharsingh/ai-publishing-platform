import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export type ArticleMediaExtension = 'svg' | 'png' | 'jpg' | 'webp';

const ARTICLE_MEDIA_PUBLIC_PREFIX = '/media/articles';

interface ArticleMediaStorageConfig {
  bucket: string;
  region: string;
  prefix: string;
  publicBaseUrl?: string;
}

let s3Client: S3Client | null = null;

function getS3StorageConfig(): ArticleMediaStorageConfig | null {
  const bucket = process.env.ARTICLE_MEDIA_S3_BUCKET?.trim();
  if (!bucket) {
    return null;
  }

  return {
    bucket,
    region: process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim() || 'us-east-1',
    prefix: process.env.ARTICLE_MEDIA_S3_PREFIX?.trim() || 'media/articles',
    publicBaseUrl: process.env.ARTICLE_MEDIA_PUBLIC_BASE_URL?.trim() || undefined,
  };
}

function getS3Client(region: string): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({ region });
  }

  return s3Client;
}

function normalizePrefix(prefix: string): string {
  return prefix.replace(/^\/+|\/+$/g, '');
}

function contentTypeForExtension(extension: ArticleMediaExtension): string {
  switch (extension) {
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
  }
}

function toBuffer(data: Buffer | string): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

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
  return `${ARTICLE_MEDIA_PUBLIC_PREFIX}/${slug}.${extension}`;
}

export function buildInlineImagePublicPath(
  slug: string,
  index: number,
  extension: ArticleMediaExtension,
): string {
  return `${ARTICLE_MEDIA_PUBLIC_PREFIX}/${slug}-inline-${index}.${extension}`;
}

export function buildArticleMediaStorageKey(filename: string, prefix?: string): string {
  const normalizedPrefix = normalizePrefix(prefix || 'media/articles');
  return normalizedPrefix ? `${normalizedPrefix}/${filename}` : filename;
}

export function buildArticleMediaPublicUrl(filename: string): string {
  const s3Config = getS3StorageConfig();
  if (!s3Config) {
    return `${ARTICLE_MEDIA_PUBLIC_PREFIX}/${filename}`;
  }

  const key = buildArticleMediaStorageKey(filename, s3Config.prefix);
  if (s3Config.publicBaseUrl) {
    return `${s3Config.publicBaseUrl.replace(/\/+$/g, '')}/${key}`;
  }

  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

async function saveArticleMedia(
  filename: string,
  data: Buffer | string,
  extension: ArticleMediaExtension,
) {
  const s3Config = getS3StorageConfig();
  if (s3Config) {
    const key = buildArticleMediaStorageKey(filename, s3Config.prefix);
    await getS3Client(s3Config.region).send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: toBuffer(data),
        ContentType: contentTypeForExtension(extension),
      }),
    );

    return buildArticleMediaPublicUrl(filename);
  }

  const directory = getArticleMediaDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), data);

  return buildArticleMediaPublicUrl(filename);
}

export async function saveArticleMediaFile(
  slug: string,
  data: Buffer | string,
  extension: ArticleMediaExtension,
): Promise<string> {
  const filename = `${slug}.${extension}`;
  return saveArticleMedia(filename, data, extension);
}

export async function saveInlineArticleMediaFile(
  slug: string,
  index: number,
  data: Buffer | string,
  extension: ArticleMediaExtension,
): Promise<string> {
  const filename = `${slug}-inline-${index}.${extension}`;
  return saveArticleMedia(filename, data, extension);
}

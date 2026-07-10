import { createOpenAiClient } from './openai-writer';

export interface FeaturedImageInput {
  title: string;
  summary: string | null;
  categoryName: string;
  slug: string;
}

export interface FeaturedImageOptions {
  prompt?: string;
}

export interface FeaturedImageResult {
  data: Buffer;
  extension: 'svg' | 'png';
  provider: 'mock' | 'openai';
  model: string;
}

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function buildMockFeaturedImageSvg(input: FeaturedImageInput): string {
  const hash = hashSlug(input.slug);
  const hueA = hash % 360;
  const hueB = (hueA + 42) % 360;
  const accentX = 720 + (hash % 280);
  const accentY = 120 + (hash % 180);
  const accentR = 140 + (hash % 120);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-hidden="true">',
    '<defs>',
    `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `<stop offset="0%" stop-color="hsl(${hueA}, 48%, 24%)"/>`,
    `<stop offset="100%" stop-color="hsl(${hueB}, 42%, 16%)"/>`,
    '</linearGradient>',
    `<radialGradient id="glow" cx="70%" cy="30%" r="60%">`,
    `<stop offset="0%" stop-color="hsl(${hueA}, 70%, 72%)" stop-opacity="0.22"/>`,
    `<stop offset="100%" stop-color="hsl(${hueB}, 60%, 40%)" stop-opacity="0"/>`,
    '</radialGradient>',
    '</defs>',
    '<rect width="1200" height="675" fill="url(#bg)"/>',
    '<rect width="1200" height="675" fill="url(#glow)"/>',
    `<circle cx="${accentX}" cy="${accentY}" r="${accentR}" fill="hsl(${hueA}, 65%, 68%)" fill-opacity="0.14"/>`,
    `<circle cx="${(accentX + 180) % 1100}" cy="${(accentY + 320) % 620}" r="${accentR + 60}" fill="hsl(${hueB}, 55%, 62%)" fill-opacity="0.1"/>`,
    `<path d="M0 520 C 220 420, 360 640, 560 520 S 920 360, 1200 470 L 1200 675 L 0 675 Z" fill="hsl(${hueA}, 45%, 32%)" fill-opacity="0.35"/>`,
    `<path d="M0 590 C 280 500, 420 690, 700 590 S 980 470, 1200 560 L 1200 675 L 0 675 Z" fill="hsl(${hueB}, 38%, 24%)" fill-opacity="0.45"/>`,
    '</svg>',
  ].join('');
}

export function generateFeaturedImageWithMock(input: FeaturedImageInput): FeaturedImageResult {
  const svg = buildMockFeaturedImageSvg(input);
  return {
    data: Buffer.from(svg, 'utf8'),
    extension: 'svg',
    provider: 'mock',
    model: 'mock-featured-image',
  };
}

export function resolveArticleImageProvider(): 'openai' | 'mock' {
  const explicit = process.env.AI_IMAGE_PROVIDER?.trim().toLowerCase();
  if (explicit === 'openai' || explicit === 'mock') {
    return explicit;
  }

  return process.env.OPENAI_API_KEY?.trim() ? 'openai' : 'mock';
}

export async function generateFeaturedImageWithOpenAI(
  input: FeaturedImageInput,
  prompt: string,
): Promise<FeaturedImageResult> {
  const client = createOpenAiClient();
  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'dall-e-3';

  const response = await client.images.generate({
    model,
    prompt,
    size: '1792x1024',
    response_format: 'url',
    n: 1,
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('OpenAI image generation returned no URL');
  }

  const download = await fetch(imageUrl);
  if (!download.ok) {
    throw new Error(`Failed to download generated image (${download.status})`);
  }

  const buffer = Buffer.from(await download.arrayBuffer());

  return {
    data: buffer,
    extension: 'png',
    provider: 'openai',
    model,
  };
}

export async function generateFeaturedImage(
  input: FeaturedImageInput,
  options?: FeaturedImageOptions,
): Promise<FeaturedImageResult> {
  if (!options?.prompt?.trim()) {
    throw new Error('Featured image generation requires a resolved prompt');
  }

  if (resolveArticleImageProvider() === 'openai') {
    try {
      return await generateFeaturedImageWithOpenAI(input, options.prompt);
    } catch {
      return generateFeaturedImageWithMock(input);
    }
  }

  return generateFeaturedImageWithMock(input);
}

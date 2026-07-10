import type { ArticleImageSuggestion } from './article-image-suggestions';
import {
  generateFeaturedImageWithOpenAI,
  resolveArticleImageProvider,
} from './article-featured-image';

export interface InlineImageInput {
  slug: string;
  index: number;
  suggestion: Pick<ArticleImageSuggestion, 'title' | 'description' | 'alt' | 'type'>;
  categoryName: string;
}

export interface InlineImageResult {
  data: Buffer;
  extension: 'svg' | 'png';
  provider: 'mock' | 'openai';
  model: string;
}

function hashValue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function buildInlineImagePrompt(
  suggestion: Pick<ArticleImageSuggestion, 'title' | 'description' | 'type'>,
  categoryName: string,
): string {
  const imageType = suggestion.type?.trim() || 'illustration';

  return [
    `Create a professional editorial ${imageType} for a technology article in the "${categoryName}" category.`,
    '',
    `Subject: ${suggestion.title}`,
    `Visual brief: ${suggestion.description}`,
    '',
    'Requirements:',
    '- Clean conceptual composition suitable for inline article placement',
    '- Modern digital illustration or diagram style',
    '- No text, logos, watermarks, or UI screenshots',
    '- Clear visual hierarchy and readable structure',
    '- 4:3 aspect ratio',
  ].join('\n');
}

export function buildMockInlineImageSvg(input: InlineImageInput): string {
  const hash = hashValue(`${input.slug}:${input.index}:${input.suggestion.title}`);
  const hue = hash % 360;
  const accentHue = (hue + 48) % 360;
  const label = input.suggestion.type?.trim() || 'illustration';

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720" role="img" aria-hidden="true">',
    '<defs>',
    `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `<stop offset="0%" stop-color="hsl(${hue}, 42%, 28%)"/>`,
    `<stop offset="100%" stop-color="hsl(${accentHue}, 36%, 18%)"/>`,
    '</linearGradient>',
    '</defs>',
    '<rect width="960" height="720" fill="url(#bg)"/>',
    `<circle cx="720" cy="180" r="140" fill="hsl(${hue}, 60%, 62%)" fill-opacity="0.16"/>`,
    `<circle cx="220" cy="520" r="180" fill="hsl(${accentHue}, 55%, 58%)" fill-opacity="0.12"/>`,
    `<path d="M80 560 C 220 420, 360 620, 520 500 S 760 360, 900 470 L 900 720 L 80 720 Z" fill="hsl(${hue}, 40%, 34%)" fill-opacity="0.35"/>`,
    `<rect x="72" y="56" width="132" height="34" rx="17" fill="hsl(${hue}, 55%, 72%)" fill-opacity="0.18"/>`,
    `<rect x="88" y="68" width="84" height="10" rx="5" fill="hsl(${hue}, 70%, 88%)" fill-opacity="0.55"/>`,
    `<rect x="120" y="220" width="720" height="12" rx="6" fill="hsl(${accentHue}, 35%, 88%)" fill-opacity="0.22"/>`,
    `<rect x="120" y="260" width="640" height="12" rx="6" fill="hsl(${accentHue}, 35%, 88%)" fill-opacity="0.18"/>`,
    `<rect x="120" y="300" width="560" height="12" rx="6" fill="hsl(${accentHue}, 35%, 88%)" fill-opacity="0.14"/>`,
    `<rect x="120" y="380" width="300" height="180" rx="18" fill="hsl(${hue}, 45%, 42%)" fill-opacity="0.28"/>`,
    `<rect x="460" y="380" width="380" height="84" rx="14" fill="hsl(${accentHue}, 40%, 40%)" fill-opacity="0.24"/>`,
    `<rect x="460" y="476" width="280" height="84" rx="14" fill="hsl(${accentHue}, 40%, 40%)" fill-opacity="0.18"/>`,
    '</svg>',
  ].join('');
}

export function generateInlineImageWithMock(input: InlineImageInput): InlineImageResult {
  return {
    data: Buffer.from(buildMockInlineImageSvg(input), 'utf8'),
    extension: 'svg',
    provider: 'mock',
    model: 'mock-inline-image',
  };
}

export async function generateInlineImage(input: InlineImageInput): Promise<InlineImageResult> {
  const prompt = buildInlineImagePrompt(input.suggestion, input.categoryName);

  if (resolveArticleImageProvider() === 'openai') {
    try {
      const result = await generateFeaturedImageWithOpenAI(
        {
          title: input.suggestion.title,
          summary: input.suggestion.description,
          categoryName: input.categoryName,
          slug: `${input.slug}-inline-${input.index}`,
        },
        prompt,
      );

      return {
        data: result.data,
        extension: result.extension,
        provider: result.provider,
        model: result.model,
      };
    } catch {
      return generateInlineImageWithMock(input);
    }
  }

  return generateInlineImageWithMock(input);
}

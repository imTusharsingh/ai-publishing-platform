import { resolveQualityThresholds } from './quality-thresholds';
import type { ArticleWriteInput, ArticleWriteResult } from './types';

function buildProseParagraph(topic: string, index: number): string {
  return (
    `This section examines ${topic} from a practical newsroom perspective. ` +
    `Readers need clear context on how trend ${index} affects markets, operators, and policy decisions in the near term. ` +
    `The analysis highlights specific signals, trade-offs, and evidence-backed implications rather than generic commentary.`
  );
}

export function buildMockArticleContent(
  title: string,
  summary: string | null,
  outline: ArticleWriteInput['outline'],
): { content: string; contentPlain: string } {
  const intro =
    summary?.trim() ||
    `This article explores ${title} with the depth expected of a professional news briefing.`;
  const sections = outline.length
    ? outline
    : [
        {
          heading: 'Overview',
          points: [`Key context for ${title}`, 'What readers should know'],
        },
        {
          heading: 'Market implications',
          points: ['Competitive dynamics', 'Regulatory and operational risks'],
        },
        {
          heading: 'Outlook',
          points: ['Near-term scenarios', 'What to watch next'],
        },
      ];

  const minWords = resolveQualityThresholds().minWordCount;
  const proseBlocks: string[] = [intro];
  const htmlSections: string[] = [];

  sections.forEach((section, sectionIndex) => {
    const paragraphs = [
      buildProseParagraph(section.heading, sectionIndex + 1),
      buildProseParagraph(section.points[0] ?? section.heading, sectionIndex + 1),
    ];
    proseBlocks.push(section.heading, ...paragraphs, ...section.points);
    htmlSections.push(
      `<h2>${section.heading}</h2>${paragraphs.map((p) => `<p>${p}</p>`).join('')}<ul>${section.points.map((point) => `<li>${point}</li>`).join('')}</ul>`,
    );
  });

  while (proseBlocks.join(' ').split(/\s+/).filter(Boolean).length < minWords) {
    const filler = buildProseParagraph(title, proseBlocks.length);
    proseBlocks.push(filler);
    htmlSections.push(`<p>${filler}</p>`);
  }

  const content = `<h1>${title}</h1><p>${intro}</p>${htmlSections.join('')}`;
  const contentPlain = [title, ...proseBlocks].join('\n\n');

  return { content, contentPlain };
}

export function writeArticleWithMock(input: ArticleWriteInput): ArticleWriteResult {
  const { content, contentPlain } = buildMockArticleContent(
    input.title,
    input.summary,
    input.outline,
  );

  return {
    content,
    contentPlain,
    provider: 'mock',
    model: 'mock-writer-v1',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}

import type { ArticleWriteInput, ArticleWriteResult } from './types';

export function buildMockArticleContent(
  title: string,
  summary: string | null,
  outline: ArticleWriteInput['outline'],
): { content: string; contentPlain: string } {
  const intro = summary?.trim() || `This article explores ${title}.`;
  const sections = outline.length
    ? outline
    : [
        {
          heading: 'Overview',
          points: [`Key context for ${title}`, 'What readers should know'],
        },
      ];

  const htmlSections = sections
    .map(
      (section) =>
        `<h2>${section.heading}</h2><ul>${section.points.map((point) => `<li>${point}</li>`).join('')}</ul>`,
    )
    .join('');

  const content = `<h1>${title}</h1><p>${intro}</p>${htmlSections}`;
  const contentPlain = [
    title,
    intro,
    ...sections.flatMap((section) => [section.heading, ...section.points]),
  ].join('\n\n');

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

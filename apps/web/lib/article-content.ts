/** Strip leading h1 — page header already shows the article title. */
export function prepareArticleHtml(html: string): string {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '').trim();
}

export function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugifyHeading(text: string): string {
  const slug =
    text
      .toLowerCase()
      .replace(/&[^;]+;/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';

  return slug;
}

export function injectHeadingIds(html: string): { html: string; headings: ArticleHeading[] } {
  const headings: ArticleHeading[] = [];
  const usedIds = new Map<string, number>();

  const htmlWithIds = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (!text) {
        return match;
      }

      if (/id\s*=/.test(attrs)) {
        const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
        if (idMatch?.[1]) {
          headings.push({ id: idMatch[1], text, level: Number(level) as 2 | 3 });
        }
        return match;
      }

      const baseId = slugifyHeading(text);
      const count = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

      headings.push({ id, text, level: Number(level) as 2 | 3 });
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    },
  );

  return { html: htmlWithIds, headings };
}

export function countWords(text: string): number {
  const plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) {
    return 0;
  }
  return plain.split(/\s+/).filter(Boolean).length;
}

export function estimateReadingMinutes(wordCount: number, wordsPerMinute = 220): number {
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

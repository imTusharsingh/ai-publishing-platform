import { isHtmlContent, prepareArticleHtml } from '@/lib/article-content';

describe('article-content', () => {
  it('strips leading h1 from html body', () => {
    const html = '<h1>Title</h1><p>Body</p>';
    expect(prepareArticleHtml(html)).toBe('<p>Body</p>');
  });

  it('detects html content', () => {
    expect(isHtmlContent('<p>Hi</p>')).toBe(true);
    expect(isHtmlContent('Plain text')).toBe(false);
  });
});

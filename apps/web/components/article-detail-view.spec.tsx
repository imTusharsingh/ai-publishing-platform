import type { ArticleDetail } from '@repo/shared';
import { render, screen } from '@testing-library/react';
import { ArticleDetailView } from '@/components/article-detail-view';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const article: ArticleDetail = {
  id: '1',
  title: 'Test Article Title',
  slug: 'test-article-title',
  summary: 'This is a test summary.',
  content: 'Full article content goes here.',
  publishedAt: '2026-06-20T10:00:00.000Z',
  authorName: 'AI Writer',
  featuredImageUrl: null,
  viewCount: '0',
  category: { id: 'cat-1', name: 'Startups', slug: 'startups' },
  seo: {
    title: 'SEO Title',
    description: 'SEO Description',
    canonicalUrl: null,
    ogImageUrl: null,
    structuredData: null,
  },
};

describe('ArticleDetailView', () => {
  it('renders article title, content, and category link', () => {
    render(<ArticleDetailView article={article} />);

    expect(screen.getByRole('heading', { name: 'Test Article Title' })).toBeInTheDocument();
    expect(screen.getByText('Full article content goes here.')).toBeInTheDocument();
    expect(screen.getAllByText('Startups').length).toBeGreaterThan(0);
    expect(screen.getByText('AI Writer')).toBeInTheDocument();
  });

  it('renders html article content without showing raw tags', () => {
    const htmlArticle: ArticleDetail = {
      ...article,
      content: '<h1>Test Article Title</h1><p>Rendered paragraph.</p><h2>Section</h2>',
    };

    const { container } = render(<ArticleDetailView article={htmlArticle} />);

    expect(container.querySelector('.article-content p')).toHaveTextContent('Rendered paragraph.');
    expect(container.textContent).not.toContain('<p>');
  });
});

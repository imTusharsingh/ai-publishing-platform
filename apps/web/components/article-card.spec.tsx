import type { ArticleSummary } from '@repo/shared';
import { render, screen } from '@testing-library/react';
import { ArticleCard } from '@/components/article-card';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const article: ArticleSummary = {
  id: '1',
  title: 'Test Article Title',
  slug: 'test-article-title',
  summary: 'This is a test summary for the article card.',
  publishedAt: '2026-06-20T10:00:00.000Z',
  authorName: 'AI Writer',
  featuredImageUrl: null,
  category: {
    id: 'cat-1',
    name: 'Startups',
    slug: 'startups',
  },
};

describe('ArticleCard', () => {
  it('renders article title, summary, and category', () => {
    render(<ArticleCard article={article} />);

    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    expect(screen.getByText(/test summary/i)).toBeInTheDocument();
    expect(screen.getByText('Startups')).toBeInTheDocument();
    expect(screen.getByText('AI Writer')).toBeInTheDocument();
  });

  it('links to article and category pages', () => {
    render(<ArticleCard article={article} />);

    expect(screen.getAllByRole('link', { name: /Test Article Title/i })[0]).toHaveAttribute(
      'href',
      '/articles/test-article-title',
    );
    expect(screen.getByRole('link', { name: 'Startups' })).toHaveAttribute(
      'href',
      '/category/startups',
    );
  });
});

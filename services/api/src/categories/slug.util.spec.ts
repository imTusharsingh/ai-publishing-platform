import { generateUniqueSlug, slugify } from './slug.util';

describe('slugify', () => {
  it('converts names to kebab-case slugs', () => {
    expect(slugify('Artificial Intelligence')).toBe('artificial-intelligence');
    expect(slugify('  SaaS & B2B Tools! ')).toBe('saas-b2b-tools');
  });
});

describe('generateUniqueSlug', () => {
  it('returns base slug when available', async () => {
    const slug = await generateUniqueSlug('Startups', async () => false);
    expect(slug).toBe('startups');
  });

  it('appends numeric suffix when slug is taken', async () => {
    const taken = new Set(['startups', 'startups-2']);
    const slug = await generateUniqueSlug('Startups', async (candidate) => taken.has(candidate));
    expect(slug).toBe('startups-3');
  });
});

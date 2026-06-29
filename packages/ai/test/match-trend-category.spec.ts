import { matchTrendToCategory } from '../src/match-trend-category';

describe('matchTrendToCategory', () => {
  const categories = [
    {
      id: 'cat-ai',
      name: 'Artificial Intelligence',
      keywords: ['ai', 'llm', 'machine learning'],
      priorityScore: 95,
    },
    {
      id: 'cat-health',
      name: 'Healthcare',
      keywords: ['healthtech', 'clinic', 'medical'],
      priorityScore: 70,
    },
  ];

  it('matches by keyword overlap', () => {
    expect(
      matchTrendToCategory(
        'New LLM benchmark results',
        'Machine learning models improve',
        categories,
      ),
    ).toBe('cat-ai');
  });

  it('falls back to highest-priority category when no keyword hits', () => {
    expect(matchTrendToCategory('Generic headline', 'No keyword overlap', categories)).toBe(
      'cat-ai',
    );
  });
});

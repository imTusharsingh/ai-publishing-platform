import { mockEmbedText } from '../src/mock-embedder';
import { embedTexts } from '../src/embed-text';
import { EMBEDDING_DIMENSIONS } from '../src/vector.util';

describe('embedTexts', () => {
  const previousProvider = process.env.AI_EMBEDDING_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.AI_EMBEDDING_PROVIDER = 'mock';
    delete process.env.OPENAI_API_KEY;
  });

  afterAll(() => {
    process.env.AI_EMBEDDING_PROVIDER = previousProvider;
    process.env.OPENAI_API_KEY = previousApiKey;
  });

  it('returns deterministic mock vectors with correct dimensions', async () => {
    const result = await embedTexts(['Hello world', 'Different text']);

    expect(result.provider).toBe('mock');
    expect(result.embeddings).toHaveLength(2);
    expect(result.embeddings[0]).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(result.embeddings[0]).toEqual(mockEmbedText('Hello world'));
    expect(result.embeddings[0]).not.toEqual(result.embeddings[1]);
  });
});

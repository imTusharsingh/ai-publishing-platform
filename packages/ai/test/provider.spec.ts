import { resolveAiProvider } from '../src/provider';

describe('resolveAiProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_WRITER_PROVIDER;
    delete process.env.OPENAI_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to mock when no OpenAI key is set', () => {
    expect(resolveAiProvider()).toBe('mock');
  });

  it('uses openai when OPENAI_API_KEY is set', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    expect(resolveAiProvider()).toBe('openai');
  });

  it('forces mock when AI_WRITER_PROVIDER=mock', () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.AI_WRITER_PROVIDER = 'mock';
    expect(resolveAiProvider()).toBe('mock');
  });

  it('throws when openai provider is forced without API key', () => {
    process.env.AI_WRITER_PROVIDER = 'openai';
    expect(() => resolveAiProvider()).toThrow('OPENAI_API_KEY');
  });
});

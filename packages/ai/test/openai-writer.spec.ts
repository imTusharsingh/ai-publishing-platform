import { writeArticleWithOpenAI } from '../src/openai-writer';

describe('writeArticleWithOpenAI', () => {
  it('returns html content and token usage', async () => {
    const client = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: '<h1>Title</h1><p>Body</p>' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200 },
          }),
        },
      },
    };

    const result = await writeArticleWithOpenAI(
      {
        title: 'Title',
        summary: 'Summary',
        outline: [{ heading: 'Intro', points: ['Point'] }],
        categoryName: 'AI',
      },
      client as never,
    );

    expect(result.provider).toBe('openai');
    expect(result.content).toContain('<h1>Title</h1>');
    expect(result.promptTokens).toBe(100);
    expect(result.completionTokens).toBe(200);
    expect(result.costUsd).toBeGreaterThan(0);
  });
});

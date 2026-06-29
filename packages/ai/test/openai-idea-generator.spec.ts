import { generateIdeaWithOpenAI } from '../src/openai-idea-generator';

describe('generateIdeaWithOpenAI', () => {
  it('parses json idea plan and returns token usage', async () => {
    const client = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'AI chips reshape semiconductors',
                    summary: 'Brief for operators and investors.',
                    intent: 'analysis',
                    outline: [{ heading: 'Overview', points: ['Demand surge', 'Supply chain'] }],
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 80, completion_tokens: 120 },
          }),
        },
      },
    };

    const result = await generateIdeaWithOpenAI(
      {
        topicTitle: 'AI chips surge',
        topicDescription: 'Semiconductor demand rises',
        categoryName: 'Tech',
      },
      client as never,
    );

    expect(result.title).toBe('AI chips reshape semiconductors');
    expect(result.outline).toHaveLength(1);
    expect(result.provider).toBe('openai');
    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: 'json_object' },
        max_tokens: 900,
      }),
    );
  });
});

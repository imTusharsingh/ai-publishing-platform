const GPT4O_MINI_INPUT_PER_MILLION = 0.15;
const GPT4O_MINI_OUTPUT_PER_MILLION = 0.6;

export function estimateOpenAiCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  if (model.startsWith('gpt-4o-mini')) {
    return (
      (promptTokens / 1_000_000) * GPT4O_MINI_INPUT_PER_MILLION +
      (completionTokens / 1_000_000) * GPT4O_MINI_OUTPUT_PER_MILLION
    );
  }

  return (
    (promptTokens / 1_000_000) * GPT4O_MINI_INPUT_PER_MILLION +
    (completionTokens / 1_000_000) * GPT4O_MINI_OUTPUT_PER_MILLION
  );
}

import { getOpenAiModel } from './provider';

export function getOpenAiTemperature(): number {
  const raw = process.env.OPENAI_TEMPERATURE?.trim();
  if (!raw) {
    return 0.45;
  }

  const value = Number(raw);
  if (Number.isNaN(value) || value < 0 || value > 2) {
    return 0.45;
  }

  return value;
}

export function getOpenAiMaxCompletionTokens(): number {
  const raw = process.env.OPENAI_MAX_COMPLETION_TOKENS?.trim();
  if (!raw) {
    return 4500;
  }

  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 500 || value > 8000) {
    return 4500;
  }

  return value;
}

export function getOpenAiWriterConfig() {
  return {
    model: getOpenAiModel(),
    temperature: getOpenAiTemperature(),
    maxCompletionTokens: getOpenAiMaxCompletionTokens(),
  };
}

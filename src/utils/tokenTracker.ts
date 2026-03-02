export interface TokenUsage {
  step: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  estimated_cost_usd: number;
}

const PRICING: Record<string, { input: number; output: number }> = {
  'llama-3.3-70b-versatile': { input: 0.59 / 1_000_000, output: 0.79 / 1_000_000 },
  'llama-3.1-8b-instant': { input: 0.05 / 1_000_000, output: 0.08 / 1_000_000 },
  'mixtral-8x7b-32768': { input: 0.24 / 1_000_000, output: 0.24 / 1_000_000 },
};

export function trackTokens(
  step: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  model: string
): TokenUsage {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const pricing = PRICING[model] ?? PRICING['llama-3.3-70b-versatile'];

  return {
    step,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
    model,
    estimated_cost_usd:
      Math.round(
        (promptTokens * pricing.input + completionTokens * pricing.output) * 1_000_000
      ) / 1_000_000,
  };
}

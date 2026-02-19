export interface TokenUsage {
  step: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  estimated_cost_usd: number;
}

// GPT-4o-mini pricing (per token)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
};

export function trackTokens(
  step: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  model: string
): TokenUsage {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const pricing = PRICING[model] ?? PRICING['gpt-4o-mini'];

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

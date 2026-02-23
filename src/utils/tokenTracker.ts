export interface TokenUsage {
  step: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  estimated_cost_usd: number;
}

// Gemini pricing (per token) — free tier has no cost
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash': { input: 0, output: 0 },
  'gemini-1.5-flash': { input: 0, output: 0 },
  'gemini-1.5-pro': { input: 1.25 / 1_000_000, output: 5.00 / 1_000_000 },
};

export function trackTokens(
  step: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  model: string
): TokenUsage {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const pricing = PRICING[model] ?? PRICING['gemini-2.5-flash'];

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

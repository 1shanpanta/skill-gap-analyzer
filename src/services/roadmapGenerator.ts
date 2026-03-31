import Groq from 'groq-sdk';
import { config } from '../config/index';
import { buildRoadmapPrompt, type RoadmapPromptData } from '../prompts/roadmap';
import { trackTokens, type TokenUsage } from '../utils/tokenTracker';

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

export async function generateRoadmap(data: RoadmapPromptData): Promise<{
  roadmap: string;
  tokenUsage: TokenUsage;
}> {
  const prompt = buildRoadmapPrompt(data);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
  const response = await groq.chat.completions.create({
    model: config.GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
  }, { signal: controller.signal });

  const roadmap = response.choices[0]?.message?.content ?? '';
  const tokenUsage = trackTokens('roadmap', {
    prompt_tokens: response.usage?.prompt_tokens ?? 0,
    completion_tokens: response.usage?.completion_tokens ?? 0,
  }, config.GROQ_MODEL);

  return { roadmap, tokenUsage };
  } finally {
    clearTimeout(timeout);
  }
}

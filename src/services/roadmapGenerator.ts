import OpenAI from 'openai';
import { config } from '../config/index.js';
import { buildRoadmapPrompt, type RoadmapPromptData } from '../prompts/roadmap.js';
import { trackTokens, type TokenUsage } from '../utils/tokenTracker.js';

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export async function generateRoadmap(data: RoadmapPromptData): Promise<{
  roadmap: string;
  tokenUsage: TokenUsage;
}> {
  const prompt = buildRoadmapPrompt(data);

  const response = await openai.chat.completions.create({
    model: config.OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const roadmap = response.choices[0]?.message?.content ?? '';
  const tokenUsage = trackTokens('roadmap', response.usage, config.OPENAI_MODEL);

  return { roadmap, tokenUsage };
}

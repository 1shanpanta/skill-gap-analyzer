import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { buildRoadmapPrompt, type RoadmapPromptData } from '../prompts/roadmap.js';
import { trackTokens, type TokenUsage } from '../utils/tokenTracker.js';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

export async function generateRoadmap(data: RoadmapPromptData): Promise<{
  roadmap: string;
  tokenUsage: TokenUsage;
}> {
  const prompt = buildRoadmapPrompt(data);

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
  });

  const roadmap = response.response.text() ?? '';
  const usage = response.response.usageMetadata;
  const tokenUsage = trackTokens('roadmap', {
    prompt_tokens: usage?.promptTokenCount ?? 0,
    completion_tokens: usage?.candidatesTokenCount ?? 0,
  }, config.GEMINI_MODEL);

  return { roadmap, tokenUsage };
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { buildResumeSuggestionsPrompt, type ResumeSuggestionsPromptData } from '../prompts/resumeRewrite.js';
import { trackTokens, type TokenUsage } from '../utils/tokenTracker.js';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

export async function generateResumeSuggestions(data: ResumeSuggestionsPromptData): Promise<{
  suggestions: string;
  tokenUsage: TokenUsage;
}> {
  const prompt = buildResumeSuggestionsPrompt(data);

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
  });

  const suggestions = response.response.text() ?? '';
  const usage = response.response.usageMetadata;
  const tokenUsage = trackTokens('resume_suggestions', {
    prompt_tokens: usage?.promptTokenCount ?? 0,
    completion_tokens: usage?.candidatesTokenCount ?? 0,
  }, config.GEMINI_MODEL);

  return { suggestions, tokenUsage };
}

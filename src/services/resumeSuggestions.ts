import OpenAI from 'openai';
import { config } from '../config/index.js';
import { buildResumeSuggestionsPrompt, type ResumeSuggestionsPromptData } from '../prompts/resumeRewrite.js';
import { trackTokens, type TokenUsage } from '../utils/tokenTracker.js';

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export async function generateResumeSuggestions(data: ResumeSuggestionsPromptData): Promise<{
  suggestions: string;
  tokenUsage: TokenUsage;
}> {
  const prompt = buildResumeSuggestionsPrompt(data);

  const response = await openai.chat.completions.create({
    model: config.OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const suggestions = response.choices[0]?.message?.content ?? '';
  const tokenUsage = trackTokens('resume_suggestions', response.usage, config.OPENAI_MODEL);

  return { suggestions, tokenUsage };
}

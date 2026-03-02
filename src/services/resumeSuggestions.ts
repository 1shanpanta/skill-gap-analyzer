import Groq from 'groq-sdk';
import { config } from '../config/index';
import { buildResumeSuggestionsPrompt, type ResumeSuggestionsPromptData } from '../prompts/resumeRewrite';
import { trackTokens, type TokenUsage } from '../utils/tokenTracker';

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

export async function generateResumeSuggestions(data: ResumeSuggestionsPromptData): Promise<{
  suggestions: string;
  tokenUsage: TokenUsage;
}> {
  const prompt = buildResumeSuggestionsPrompt(data);

  const response = await groq.chat.completions.create({
    model: config.GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const suggestions = response.choices[0]?.message?.content ?? '';
  const tokenUsage = trackTokens('resume_suggestions', {
    prompt_tokens: response.usage?.prompt_tokens ?? 0,
    completion_tokens: response.usage?.completion_tokens ?? 0,
  }, config.GROQ_MODEL);

  return { suggestions, tokenUsage };
}

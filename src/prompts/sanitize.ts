/**
 * Sanitize user-provided text before interpolating into LLM prompts.
 *
 * Defenses:
 * 1. Strip common prompt injection delimiters that try to break out of the
 *    user-content boundary (e.g. "## Instructions", "SYSTEM:", triple-backtick fences).
 * 2. Truncate to a safe maximum length to prevent context-window abuse.
 * 3. Wrap the result in clear XML-style delimiters so the model can distinguish
 *    system instructions from user content.
 */

const INJECTION_PATTERNS = [
  // Attempts to inject new system / instruction blocks
  /^#{1,4}\s*(system|instructions?|ignore|forget|override|new task)/gim,
  // "SYSTEM:", "ASSISTANT:", "USER:" role markers
  /^(SYSTEM|ASSISTANT|USER|HUMAN)\s*:/gim,
  // Triple backtick code fences that could wrap injected instructions
  /```/g,
];

const DEFAULT_MAX_LENGTH = 50_000;

export function sanitizePromptInput(
  text: string,
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  let cleaned = text.slice(0, maxLength);

  for (const pattern of INJECTION_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned;
}

export function wrapUserContent(label: string, text: string): string {
  const sanitized = sanitizePromptInput(text);
  return `<user-provided-${label}>\n${sanitized}\n</user-provided-${label}>`;
}

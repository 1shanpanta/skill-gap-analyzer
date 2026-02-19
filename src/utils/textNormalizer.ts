export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')           // newlines -> space
    .replace(/[^a-z0-9\s\-./+#]/g, ' ') // keep hyphens, dots, slashes, plus, hash
    .replace(/\s+/g, ' ')               // collapse whitespace
    .trim();
}

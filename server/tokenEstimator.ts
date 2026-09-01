/**
 * Token Estimation and Prompt Compaction Utility
 * Provides lightweight token estimation and context compaction to prevent payload bloat.
 */

export const DEFAULT_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS_PER_REQUEST) || 2048;
export const MODEL_MAX_CONTEXT_TOKENS = Number(process.env.MODEL_MAX_CONTEXT_TOKENS) || 16384;

/**
 * Fast token estimation: ~4 characters per token average for English and code text.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export interface CompactionResult {
  text: string;
  originalTokens: number;
  estimatedTokens: number;
  compacted: boolean;
}

/**
 * Compacts prompt to fit within token budget while preserving critical instructions.
 */
export function compactPrompt(
  prompt: string,
  maxTokens: number = DEFAULT_MAX_TOKENS
): CompactionResult {
  if (!prompt) {
    return { text: '', originalTokens: 0, estimatedTokens: 0, compacted: false };
  }

  const originalTokens = estimateTokens(prompt);
  if (originalTokens <= maxTokens) {
    return {
      text: prompt,
      originalTokens,
      estimatedTokens: originalTokens,
      compacted: false,
    };
  }

  // Calculate maximum allowed character length
  const maxChars = Math.max(100, maxTokens * 4 - 80); // Reserve 80 chars for truncation notice
  const headChars = Math.floor(maxChars * 0.7);
  const tailChars = Math.floor(maxChars * 0.3);

  const head = prompt.substring(0, headChars);
  const tail = prompt.substring(prompt.length - tailChars);
  const compactedText = `${head}\n\n[... Context compressed: ${originalTokens - maxTokens} est. tokens trimmed ...]\n\n${tail}`;

  return {
    text: compactedText,
    originalTokens,
    estimatedTokens: estimateTokens(compactedText),
    compacted: true,
  };
}

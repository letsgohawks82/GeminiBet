import { describe, it, expect } from 'vitest';
import { estimateTokens, compactPrompt } from '../server/tokenEstimator';

describe('tokenEstimator', () => {
  it('accurately estimates tokens based on character length', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('12345678')).toBe(2);
    expect(estimateTokens('Hello world this is a test prompt')).toBeGreaterThan(5);
  });

  it('keeps short prompts uncompacted', () => {
    const prompt = 'Short prompt under budget';
    const result = compactPrompt(prompt, 500);
    expect(result.compacted).toBe(false);
    expect(result.text).toBe(prompt);
    expect(result.originalTokens).toBe(estimateTokens(prompt));
  });

  it('compacts prompts that exceed the token budget and includes compression notice', () => {
    const longPrompt = 'Long section '.repeat(300);
    const result = compactPrompt(longPrompt, 50);

    expect(result.compacted).toBe(true);
    expect(result.text).toContain('Context compressed');
    expect(result.estimatedTokens).toBeLessThan(result.originalTokens);
  });
});

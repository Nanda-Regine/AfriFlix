import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit as redisRateLimit } from './redis'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-6'

// Delegate to Redis-backed rate limiter (falls back to in-memory in dev)
export async function checkRateLimit(identifier: string, limit = 10, windowMs = 60_000): Promise<boolean> {
  return redisRateLimit(identifier, limit, windowMs)
}

export function safeParseJSON<T>(text: string): T | null {
  try {
    // Strip markdown code fences if Claude wraps output
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

/**
 * Wraps a static system prompt string into a cacheable content block.
 * Claude caches tokens up to and including the last cache_control block.
 * Cache TTL: 5 minutes (ephemeral). Cache read costs 10% of base; write costs 125%.
 * Use on any system prompt that is static across many requests.
 */
export function cachedSystem(text: string): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: 'text',
      text,
      cache_control: { type: 'ephemeral' },
    },
  ]
}

/**
 * For multi-turn chat: mark the last "stable" assistant message for caching.
 * Put this on the last message in a long static context (e.g. few-shot examples).
 */
export function withCache(
  messages: Anthropic.Messages.MessageParam[]
): Anthropic.Messages.MessageParam[] {
  if (messages.length === 0) return messages

  const last = messages[messages.length - 1]
  const content = typeof last.content === 'string'
    ? [{ type: 'text' as const, text: last.content, cache_control: { type: 'ephemeral' as const } }]
    : last.content.map((block, i) =>
        i === (last.content as Anthropic.Messages.ContentBlockParam[]).length - 1
          ? { ...block, cache_control: { type: 'ephemeral' as const } }
          : block
      )

  return [...messages.slice(0, -1), { ...last, content }]
}

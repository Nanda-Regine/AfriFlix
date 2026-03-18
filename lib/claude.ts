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

import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit as redisRateLimit, getRedis } from './redis'
import { createHash } from 'crypto'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── Model selection ────────────────────────────────────────────────────────
// Sonnet: high-quality tasks (Creative DNA, AfriBrain oracle, creator assistant)
// Haiku: cheap fast tasks (tag suggestions, card descriptions, moderation labels)
export const CLAUDE_MODEL = 'claude-sonnet-4-6'
export const CLAUDE_HAIKU = 'claude-haiku-4-5-20251001'

// Delegate to Redis-backed rate limiter (falls back to in-memory in dev)
export async function checkRateLimit(identifier: string, limit = 10, windowMs = 60_000): Promise<boolean> {
  return redisRateLimit(identifier, limit, windowMs)
}

export function safeParseJSON<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

/**
 * Wraps a static system prompt string into a cacheable content block.
 * Cache read = 10% of base cost. Cache write = 125% (amortised over many calls).
 * Use on any system prompt that is static across many requests.
 */
export function cachedSystem(text: string): Anthropic.Messages.TextBlockParam[] {
  return [{ type: 'text', text, cache_control: { type: 'ephemeral' } }]
}

/**
 * For multi-turn chat: mark the last "stable" message for caching.
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

// ── Response caching via Redis ─────────────────────────────────────────────
// Cache identical AI prompts for up to 15 minutes to avoid redundant API calls.
// Key = sha256(model + system + last user message). Only cache single-turn calls.

const AI_CACHE_TTL = 60 * 15 // 15 minutes

function aiCacheKey(model: string, system: string, userMessage: string): string {
  return 'ai:v1:' + createHash('sha256')
    .update(`${model}|${system}|${userMessage}`)
    .digest('hex')
}

export async function getCachedResponse(
  model: string, system: string, userMessage: string
): Promise<string | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const key = aiCacheKey(model, system, userMessage)
    return await redis.get<string>(key)
  } catch {
    return null
  }
}

export async function setCachedResponse(
  model: string, system: string, userMessage: string, response: string
): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const key = aiCacheKey(model, system, userMessage)
    await redis.set(key, response, { ex: AI_CACHE_TTL })
  } catch {
    // Non-fatal — cache miss on next call is fine
  }
}

// ── Platform context caching ───────────────────────────────────────────────
// AfriBrain fetches top works + creators on every call. Cache for 15 min.

const CONTEXT_KEY = 'afriflix:platform_context:v2'
const CONTEXT_TTL = 60 * 15

export async function getCachedPlatformContext(): Promise<string | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    return await redis.get<string>(CONTEXT_KEY)
  } catch {
    return null
  }
}

export async function setCachedPlatformContext(context: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(CONTEXT_KEY, context, { ex: CONTEXT_TTL })
  } catch {}
}

// ── Token budget tracking ──────────────────────────────────────────────────
// Soft daily budget per user — prevent any single user burning excessive tokens.
// Haiku: ~$0.00025/1K input, ~$0.00125/1K output
// Sonnet: ~$0.003/1K input, ~$0.015/1K output

const DAILY_TOKEN_BUDGET = 50_000 // ~$0.75 worst case per user per day on Sonnet

export async function checkTokenBudget(userId: string, tokensNeeded: number): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true // no Redis = no budget enforcement (dev)
  try {
    const key = `token_budget:${userId}:${new Date().toISOString().slice(0, 10)}`
    const current = await redis.get<number>(key) ?? 0
    if (current + tokensNeeded > DAILY_TOKEN_BUDGET) return false
    await redis.incrby(key, tokensNeeded)
    // Set TTL only on first write
    if (current === 0) await redis.expire(key, 86_400)
    return true
  } catch {
    return true
  }
}

export async function recordTokenUsage(userId: string, tokensUsed: number): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const key = `token_budget:${userId}:${new Date().toISOString().slice(0, 10)}`
    await redis.incrby(key, tokensUsed)
    await redis.expire(key, 86_400)
  } catch {}
}

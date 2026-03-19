/**
 * AfriFlix Security Helpers
 * Centralized input validation, sanitization, and request hardening.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG_RE = /^[a-z0-9-]{1,80}$/
const USERNAME_RE = /^[a-z0-9_]{3,30}$/

// ── Validators ─────────────────────────────────────────────────────────────

export function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

export function isValidSlug(v: unknown): v is string {
  return typeof v === 'string' && SLUG_RE.test(v)
}

export function isValidUsername(v: unknown): v is string {
  return typeof v === 'string' && USERNAME_RE.test(v)
}

export function isValidEmail(v: unknown): v is string {
  if (typeof v !== 'string') return false
  // RFC 5321 rough check — Supabase validates fully on signup
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
}

export function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0
}

// ── Sanitizers ─────────────────────────────────────────────────────────────

/**
 * Strip any HTML/script content from a string.
 * Used on all user-generated text before storing.
 */
export function sanitizeText(v: unknown, maxLength = 5000): string {
  if (typeof v !== 'string') return ''
  return v
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')      // strip JS protocol
    .replace(/on\w+\s*=/gi, '')        // strip event handlers
    .replace(/data:\w+\/\w+;base64/gi, '') // strip data URIs
    .trim()
    .slice(0, maxLength)
}

/**
 * Sanitize an array of string tags.
 * Strips HTML, limits count and individual length.
 */
export function sanitizeTags(v: unknown, maxCount = 20, maxTagLen = 50): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter(t => typeof t === 'string')
    .map(t => sanitizeText(t, maxTagLen))
    .filter(t => t.length > 0)
    .slice(0, maxCount)
}

// ── Request Guards ─────────────────────────────────────────────────────────

/**
 * Check Content-Length header is within limit.
 * Note: actual body is still needed for exact size; this is a fast pre-check.
 */
export function isBodySizeOk(req: Request, maxBytes = 4 * 1024 * 1024): boolean {
  const cl = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (isNaN(cl)) return true // no header — allow through (body check handles it)
  return cl <= maxBytes
}

/**
 * Get real client IP from Cloudflare/Vercel headers.
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

/**
 * Validate and parse JSON body with size limit.
 * Returns [data, error] tuple.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  req: Request,
  maxBytes = 64 * 1024 // 64 KB default for JSON APIs
): Promise<[T | null, string | null]> {
  if (!isBodySizeOk(req, maxBytes)) {
    return [null, 'Request body too large']
  }
  try {
    const data = await req.json() as T
    return [data, null]
  } catch {
    return [null, 'Invalid JSON']
  }
}

/**
 * Rate-limit response helper.
 */
export function rateLimitedResponse(retryAfterSeconds = 60): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait before retrying.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
        'Cache-Control': 'no-store',
      },
    }
  )
}

/**
 * Standard error response factory.
 */
export function errorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  )
}

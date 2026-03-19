import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Config ─────────────────────────────────────────────────────────────────
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Known scanner / exploit paths — block immediately at edge
const BLOCKED_PATH_PATTERNS = [
  /\.(php|asp|aspx|jsp|cgi|env|git|svn|htaccess|htpasswd|config|bak|sql|sh|bash|py|rb|pl)$/i,
  /\/(wp-admin|wp-login|phpmyadmin|adminer|xmlrpc|\.well-known\/acme-challenge)/i,
  /\/\.\./,                        // path traversal
  /(union\s+select|drop\s+table|insert\s+into|script\s*>|onerror\s*=)/i, // SQLi / XSS in URL
  /(%00|%0a|%0d|%27|%3c|%3e){2,}/i, // encoded attack sequences
]

// Paths exempt from body-size / CSRF checks (webhook endpoints have their own auth)
const WEBHOOK_PATHS = [
  '/api/payments/payfast/webhook',
  '/api/payments/flutterwave/webhook',
  '/api/payouts/flutterwave-webhook',
  '/api/payments/stripe/webhook',
  '/api/cron/payouts',
  '/api/cron/trending',
]

// Max request body size (4 MB — uploads go directly to Cloudflare/R2, not here)
const MAX_BODY_BYTES = 4 * 1024 * 1024

// In-memory IP rate limiter (edge-compatible, per-isolate)
// For production scale use Upstash Redis Edge client — this covers the basics
const ipWindows = new Map<string, { count: number; reset: number }>()

function ipRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = ipWindows.get(ip)
  if (!entry || now > entry.reset) {
    ipWindows.set(ip, { count: 1, reset: now + windowMs })
    // Prune old entries every ~1000 requests to prevent memory leak
    if (ipWindows.size > 5000) {
      for (const [k, v] of ipWindows) if (now > v.reset) ipWindows.delete(k)
    }
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

function isWebhook(pathname: string): boolean {
  return WEBHOOK_PATHS.some(p => pathname.startsWith(p))
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method
  const ip = getIP(req)

  // ── 1. Block scanner/exploit paths ────────────────────────────────────────
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(pathname) || pattern.test(req.nextUrl.search)) {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  // ── 2. Dashboard protection — must be authenticated (Supabase cookie check) ─
  // We only block obviously unauthenticated requests; Supabase verifies server-side
  if (pathname.startsWith('/dashboard') && !req.cookies.has('sb-access-token') && !req.cookies.has('sb-refresh-token')) {
    // Check for any supabase auth cookie (cookie name varies by Supabase project ref)
    const hasAuth = [...req.cookies.getAll()].some(c => c.name.includes('auth-token') || c.name.includes('supabase'))
    if (!hasAuth) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── 3. API route hardening ─────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const isWebhookReq = isWebhook(pathname)

    // 3a. Content-Type enforcement for mutation endpoints (not webhooks)
    if (MUTATION_METHODS.has(method) && !isWebhookReq) {
      const ct = req.headers.get('content-type') ?? ''
      const isJson = ct.includes('application/json')
      const isForm = ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')
      const isText = ct.includes('text/')
      if (!isJson && !isForm && !isText) {
        return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
      }
    }

    // 3b. Body size limit (Content-Length header check — actual body checked in route)
    const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
    if (!isWebhookReq && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }

    // 3c. IP rate limiting for API — 60 req/min for GETs, 30 req/min for mutations
    const apiLimit = MUTATION_METHODS.has(method) ? 30 : 60
    if (!ipRateLimit(`api:${ip}`, apiLimit, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // 3d. Aggressive rate limit on AI endpoints
    if (pathname.startsWith('/api/ai/')) {
      if (!ipRateLimit(`ai:${ip}`, 10, 60_000)) {
        return NextResponse.json(
          { error: 'AI rate limit exceeded' },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }
    }

    // 3e. Block private API paths from being called directly from browser
    if (pathname.startsWith('/api/cron/')) {
      const auth = req.headers.get('authorization')
      const expected = `Bearer ${process.env.CRON_SECRET}`
      if (auth !== expected) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // ── 4. Add security headers to all responses ───────────────────────────────
  const res = NextResponse.next()

  // Prevent clickjacking on all pages
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  // Remove server fingerprinting
  res.headers.delete('X-Powered-By')
  res.headers.delete('Server')

  return res
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)',
  ],
}

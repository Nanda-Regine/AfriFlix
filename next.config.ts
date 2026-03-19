import type { NextConfig } from 'next'

// ── Content Security Policy ────────────────────────────────────────────────
// Locked-down allowlist. unsafe-eval removed; only needed if Tailwind JIT
// runs client-side (it doesn't in production builds).
const CSP = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for hydration scripts; no eval needed in prod
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Images: self + Supabase storage + Cloudflare + R2 public URLs
  "img-src 'self' data: blob: https://*.supabase.co https://customer-*.cloudflarestream.com https://*.r2.cloudflarestorage.com https://*.r2.dev",
  // Video/audio: Cloudflare Stream + R2
  "media-src 'self' blob: https://customer-*.cloudflarestream.com https://*.r2.cloudflarestorage.com https://*.r2.dev",
  // API connections: Supabase (REST + Realtime), R2 presigned uploads, payment gateways
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com https://api.flutterwave.com https://www.payfast.co.za https://sandbox.payfast.co.za",
  "font-src 'self' data:",
  // Frames: PayFast checkout + Cloudflare Stream iframes for live
  "frame-src https://www.payfast.co.za https://sandbox.payfast.co.za https://customer-*.cloudflarestream.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,

  images: {
    // Allow only known trusted domains
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'customer-*.cloudflarestream.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
    // Limit image dimensions to prevent massive image attacks
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
  },

  // Disable powered-by header
  poweredByHeader: false,

  async headers() {
    return [
      // ── Static assets — immutable cache ────────────────────────────────
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' }],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },

      // ── API routes — never cache, strict headers ─────────────────────
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },

      // ── Dashboard — no indexing ──────────────────────────────────────
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },

      // ── Security headers for ALL routes ──────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Allow microphone for audio recording in upload; block everything else
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), midi=()' },
          // HSTS — 2 years, include subdomains, submit to preload list
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Prevent cross-origin data leaks
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }, // allow PayFast popup
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' }, // needed for Cloudflare iframes
          // Remove server info
          { key: 'X-Powered-By', value: '' },
        ],
      },
    ]
  },
}

export default nextConfig

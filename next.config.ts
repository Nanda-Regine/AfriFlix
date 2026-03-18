import type { NextConfig } from 'next'

// Content Security Policy
// - script-src 'unsafe-inline': Next.js inlines bootstrap scripts for hydration
// - style-src 'unsafe-inline': Tailwind + Next.js inject inline styles
// - upgrade-insecure-requests: force HTTPS in production
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  // Cloudflare Stream, R2, and Supabase storage for media
  "media-src 'self' blob: https://*.cloudflarestream.com https://*.r2.cloudflarestorage.com https://customer-*.cloudflarestream.com",
  // Supabase realtime (wss), Anthropic Claude API, Flutterwave, PayFast, Cloudflare
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.flutterwave.com https://www.payfast.co.za https://sandbox.payfast.co.za https://*.r2.cloudflarestorage.com",
  "font-src 'self' data:",
  "frame-src https://www.payfast.co.za https://sandbox.payfast.co.za",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'customer-*.cloudflarestream.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // API routes are not embeddable and return JSON, not HTML
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      // Webhook endpoints: no caching, explicit no-frame
      {
        source: '/api/payments/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      // Service worker: no-cache so it always fetches fresh
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // Static assets: long-lived cache (Next.js hashes filenames)
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Icons
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig

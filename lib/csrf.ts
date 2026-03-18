/**
 * CSRF protection for mutation API routes.
 *
 * Strategy: verify the Origin header against the app URL when present.
 * Same-origin browser requests may omit Origin (e.g., navigations), so absence is
 * allowed. Presence of a mismatched Origin is an attack — blocked.
 *
 * Webhooks (PayFast, Flutterwave) must bypass this — they are server-to-server
 * requests with no Origin header, which this function allows.
 */
export function isCsrfSafe(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // no Origin = same-origin or server-to-server; allow

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'

  try {
    const { origin: expected } = new URL(appUrl)
    return origin === expected
  } catch {
    return false
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'
import crypto from 'crypto'

/**
 * POST /api/payments/payfast/cancel-subscription
 * Cancels the creator's active PayFast subscription via the Fetch API.
 * https://developers.payfast.co.za/api#subscriptions_cancel
 */
export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: creator } = await supabase
    .from('creators')
    .select('id, payfast_subscription_token, plan')
    .eq('user_id', user.id)
    .single()

  if (!creator?.payfast_subscription_token) {
    return NextResponse.json({ error: 'No active PayFast subscription' }, { status: 400 })
  }

  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? ''
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ''
  const isSandbox  = process.env.PAYFAST_SANDBOX === 'true'

  const timestamp = new Date().toISOString()
  const version   = 'v1'

  // PayFast API signature: MD5 of "merchant-id={id}&passphrase={pp}&timestamp={ts}&version={v}"
  const sigStr  = `merchant-id=${merchantId}&passphrase=${encodeURIComponent(passphrase)}&timestamp=${encodeURIComponent(timestamp)}&version=${version}`
  const signature = crypto.createHash('md5').update(sigStr).digest('hex')

  const apiBase = isSandbox
    ? 'https://api.payfast.co.za'
    : 'https://api.payfast.co.za'

  const res = await fetch(
    `${apiBase}/subscriptions/${creator.payfast_subscription_token}/cancel`,
    {
      method: 'PUT',
      headers: {
        'merchant-id': merchantId,
        'version': version,
        'timestamp': timestamp,
        'signature': signature,
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error('[payfast/cancel-subscription]', res.status, text)
    return NextResponse.json({ error: 'Failed to cancel subscription with PayFast' }, { status: 502 })
  }

  // Update DB — revert to free plan, clear token
  await supabase
    .from('creators')
    .update({
      plan: 'free',
      payfast_subscription_token: null,
      subscription_active_until: null,
    })
    .eq('id', creator.id)

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('creator_id', creator.id)
    .eq('status', 'active')

  return NextResponse.json({ ok: true })
}

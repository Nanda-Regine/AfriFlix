import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// PayFast valid IPs (production + sandbox)
const PAYFAST_IPS = new Set([
  '197.97.145.144', '197.97.145.145', '197.97.145.146', '197.97.145.147',
  '197.97.145.148', '197.97.145.149', '197.97.145.150', '197.97.145.151',
  '41.74.179.194',  '41.74.179.195',  '41.74.179.196',  '41.74.179.197',
  '127.0.0.1', // sandbox
])

function verifySignature(params: Record<string, string>, passphrase?: string): boolean {
  const { signature, ...rest } = params
  const ordered = Object.keys(rest).sort().reduce<Record<string, string>>((acc, k) => {
    acc[k] = rest[k]
    return acc
  }, {})
  const payload = Object.entries(ordered)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&')
  const toHash = passphrase
    ? `${payload}&passphrase=${encodeURIComponent(passphrase.trim())}`
    : payload
  const expected = crypto.createHash('md5').update(toHash).digest('hex')
  return expected === signature
}

export async function POST(req: Request) {
  try {
    // x-real-ip is set by Nginx/Vercel directly; x-forwarded-for can be spoofed by callers
    const ip = (
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      ''
    ).trim()

    if (!PAYFAST_IPS.has(ip) && process.env.PAYFAST_SANDBOX !== 'true') {
      console.warn('[payfast/webhook] Blocked IP:', ip)
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.text()
    const params = Object.fromEntries(new URLSearchParams(body))

    const passphrase = process.env.PAYFAST_PASSPHRASE
    if (!verifySignature(params, passphrase)) {
      console.warn('[payfast/webhook] Signature mismatch')
      return new NextResponse('Invalid signature', { status: 400 })
    }

    const {
      payment_status,
      custom_str1,   // tipId OR creatorId depending on payment type
      custom_str2,   // creatorId for tips OR plan key for subscriptions
      custom_str3,   // subscription reference
      amount_gross,
      token,                    // PayFast subscription token (present for recurring)
      subscription_type,        // '1' for subscription IPN
      billing_date,
    } = params

    const supabase = await createClient()

    // ── Subscription IPN ────────────────────────────────────────────────────
    if (subscription_type === '1') {
      const creatorId = custom_str1
      const plan      = custom_str2 as string

      if (!creatorId || !plan) return new NextResponse('Missing subscription data', { status: 400 })

      const validPlans = ['creator_pro', 'label']
      if (!validPlans.includes(plan)) return new NextResponse('Invalid plan', { status: 400 })

      if (payment_status === 'COMPLETE') {
        // First charge or renewal — activate plan + store token
        const nextBilling = billing_date
          ? new Date(new Date(billing_date).setMonth(new Date(billing_date).getMonth() + 1)).toISOString().split('T')[0]
          : null

        await supabase
          .from('creators')
          .update({
            plan,
            payfast_subscription_token: token ?? null,
            subscription_billing_date: billing_date ?? null,
            subscription_active_until: nextBilling
              ? new Date(nextBilling).toISOString()
              : null,
          })
          .eq('id', creatorId)

        // Log subscription event
        await supabase.from('subscriptions').upsert({
          creator_id: creatorId,
          plan,
          provider: 'payfast',
          payment_reference: custom_str3 ?? null,
          token: token ?? null,
          amount: parseFloat(amount_gross ?? '0'),
          currency: 'ZAR',
          status: 'active',
          billing_date: billing_date ?? null,
          next_billing_date: nextBilling,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'creator_id' })

      } else if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
        // Subscription lapsed — revert to free
        await supabase
          .from('creators')
          .update({
            plan: 'free',
            payfast_subscription_token: null,
            subscription_active_until: null,
          })
          .eq('id', creatorId)

        await supabase
          .from('subscriptions')
          .update({ status: payment_status === 'CANCELLED' ? 'cancelled' : 'failed', updated_at: new Date().toISOString() })
          .eq('creator_id', creatorId)
          .eq('status', 'active')
      }

      return new NextResponse('OK', { status: 200 })
    }

    // ── One-time tip IPN ─────────────────────────────────────────────────────
    const tipId     = custom_str1
    const creatorId = custom_str2

    if (!tipId) return new NextResponse('Missing tip ID', { status: 400 })

    if (payment_status === 'COMPLETE') {
      await supabase.from('tips').update({ status: 'completed' }).eq('id', tipId)

      if (creatorId) {
        await supabase.rpc('increment_creator_tips', {
          p_creator_id: creatorId,
          p_amount: parseFloat(amount_gross ?? '0'),
        })
      }
    } else if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
      await supabase.from('tips').update({ status: 'failed' }).eq('id', tipId)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[payfast/webhook]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

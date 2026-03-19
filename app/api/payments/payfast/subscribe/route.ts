import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'
import crypto from 'crypto'

const PLAN_CONFIG = {
  creator_pro: { label: 'AfriFlix Creator Pro', amount: 99.00 },
  label:       { label: 'AfriFlix Label / Brand', amount: 499.00 },
} as const

type PlanKey = keyof typeof PLAN_CONFIG

function buildPayload(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&')
}

function signPayFast(params: Record<string, string>, passphrase?: string): string {
  const payload = buildPayload(params)
  const toSign  = passphrase
    ? `${payload}&passphrase=${encodeURIComponent(passphrase.trim())}`
    : payload
  return crypto.createHash('md5').update(toSign).digest('hex')
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (!PLAN_CONFIG[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, plan')
    .eq('user_id', user.id)
    .single()

  if (!creator) return NextResponse.json({ error: 'Creator profile required' }, { status: 403 })
  if (creator.plan === plan) return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })

  const merchantId  = process.env.PAYFAST_MERCHANT_ID ?? ''
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? ''
  const passphrase  = process.env.PAYFAST_PASSPHRASE
  const isSandbox   = process.env.PAYFAST_SANDBOX === 'true'

  if (!merchantId || !merchantKey) {
    return NextResponse.json({ error: 'PayFast not configured' }, { status: 503 })
  }

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'
  const reference = `AF-SUB-${creator.id.slice(0, 8)}-${Date.now()}`
  const planConf  = PLAN_CONFIG[plan]

  // PayFast recurring subscription params
  // merchant_key is passed in the form but EXCLUDED from signature
  const params: Record<string, string> = {
    merchant_id:       merchantId,
    merchant_key:      merchantKey,
    return_url:        `${appUrl}/dashboard/earnings?subscribed=1`,
    cancel_url:        `${appUrl}/dashboard/earnings`,
    notify_url:        `${appUrl}/api/payments/payfast/webhook`,

    name_first:        creator.display_name.split(' ')[0] ?? 'Creator',
    email_address:     user.email ?? '',

    m_payment_id:      reference,
    amount:            planConf.amount.toFixed(2),
    item_name:         planConf.label,
    item_description:  `Monthly subscription — ${planConf.label}`,

    // Subscription-specific fields
    subscription_type: '1',             // 1 = recurring subscription
    billing_date:      today(),          // start billing immediately
    recurring_amount:  planConf.amount.toFixed(2),
    frequency:         '3',             // 3 = monthly
    cycles:            '0',             // 0 = indefinite

    custom_str1:       creator.id,      // creator_id for IPN
    custom_str2:       plan,            // plan key for IPN
    custom_str3:       reference,
  }

  // Signature excludes merchant_key
  const { merchant_key: _mk, ...sigParams } = params
  params.signature = signPayFast(sigParams, passphrase)

  const baseUrl = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'

  const checkoutUrl = `${baseUrl}?${buildPayload(params)}`
  return NextResponse.json({ checkoutUrl })
}

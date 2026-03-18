import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'
import crypto from 'crypto'

function buildPayFastPayload(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&')
}

function signPayFast(params: Record<string, string>, passphrase?: string): string {
  const payload = buildPayFastPayload(params)
  const toSign = passphrase
    ? `${payload}&passphrase=${encodeURIComponent(passphrase.trim())}`
    : payload
  return crypto.createHash('md5').update(toSign).digest('hex')
}

function buildFlutterwavePayload(params: {
  amount: number
  currency: string
  email: string
  name: string
  reference: string
  redirectUrl: string
  meta: Record<string, string>
}) {
  return {
    tx_ref: params.reference,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    customer: { email: params.email, name: params.name },
    meta: params.meta,
    customizations: {
      title: 'AfriFlix Tip',
      description: 'Support an African creator',
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/icons/icon-192.png`,
    },
  }
}

export async function POST(req: Request) {
  try {
    if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { creatorId, workId, amount, currency, message, provider } = await req.json()

    // Validate UUIDs to prevent injection via Supabase query params
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!creatorId || !UUID_RE.test(creatorId)) {
      return NextResponse.json({ error: 'Invalid creatorId' }, { status: 400 })
    }
    if (workId !== undefined && workId !== null && !UUID_RE.test(workId)) {
      return NextResponse.json({ error: 'Invalid workId' }, { status: 400 })
    }
    if (!amount || typeof amount !== 'number' || amount < 10 || amount > 100_000) {
      return NextResponse.json({ error: 'Amount must be between 10 and 100,000' }, { status: 400 })
    }
    if (!['payfast', 'flutterwave'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 })
    }
    const VALID_CURRENCIES = ['ZAR', 'USD', 'GBP', 'EUR', 'NGN', 'KES', 'GHS', 'XOF', 'EGP']
    if (currency && !VALID_CURRENCIES.includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    // Fetch creator — user email comes from the auth session directly
    const { data: creator } = await supabase
      .from('creators')
      .select('display_name, tips_enabled')
      .eq('id', creatorId)
      .single()

    if (!creator?.tips_enabled) {
      return NextResponse.json({ error: 'This creator has not enabled tips' }, { status: 403 })
    }

    // Create a pending tip record
    const reference = `AF-TIP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const { data: tip, error: tipError } = await supabase.from('tips').insert({
      from_user_id: user.id,
      to_creator_id: creatorId,
      work_id: workId ?? null,
      amount,
      currency: currency ?? 'ZAR',
      message: message?.trim() || null,
      payment_provider: provider,
      payment_reference: reference,
      status: 'pending',
    }).select().single()

    if (tipError) throw tipError

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'
    const returnUrl = `${appUrl}/tip/success?ref=${reference}`
    const cancelUrl = `${appUrl}/tip/cancel?ref=${reference}`
    const notifyUrl = `${appUrl}/api/payments/${provider}/webhook`

    if (provider === 'payfast') {
      const merchantId = process.env.PAYFAST_MERCHANT_ID ?? ''
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? ''
      const passphrase = process.env.PAYFAST_PASSPHRASE

      if (!merchantId || !merchantKey) {
        return NextResponse.json({ error: 'PayFast not configured' }, { status: 503 })
      }

      const params: Record<string, string> = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        name_first: user.email?.split('@')[0] ?? 'Fan',
        email_address: user.email ?? '',
        m_payment_id: reference,
        amount: amount.toFixed(2),
        item_name: `Tip for ${creator.display_name}`,
        item_description: message?.trim().slice(0, 255) ?? '',
        custom_str1: tip.id,
        custom_str2: creatorId,
      }

      params.signature = signPayFast(params, passphrase)

      const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
      const baseUrl = isSandbox
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process'

      const checkoutUrl = `${baseUrl}?${buildPayFastPayload(params)}&signature=${params.signature}`
      return NextResponse.json({ checkoutUrl, tipId: tip.id })
    }

    // Flutterwave
    const flwKey = process.env.FLUTTERWAVE_SECRET_KEY
    if (!flwKey) {
      return NextResponse.json({ error: 'Flutterwave not configured' }, { status: 503 })
    }

    const flwPayload = buildFlutterwavePayload({
      amount,
      currency: currency ?? 'ZAR',
      email: user.email ?? user.id,
      name: user.email?.split('@')[0] ?? 'Fan',
      reference,
      redirectUrl: returnUrl,
      meta: { tipId: tip.id, creatorId },
    })

    const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${flwKey}`,
      },
      body: JSON.stringify(flwPayload),
    })

    const flwData = await flwRes.json()

    if (!flwRes.ok || flwData.status !== 'success') {
      return NextResponse.json({ error: 'Flutterwave error' }, { status: 502 })
    }

    return NextResponse.json({ checkoutUrl: flwData.data.link, tipId: tip.id })
  } catch (error) {
    console.error('[tip]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'
import { isCsrfSafe } from '@/lib/csrf'
import type { PlanKey } from '@/lib/stripe'

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: creator } = await supabase
    .from('creators')
    .select('id, stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!creator) return NextResponse.json({ error: 'Creator profile required' }, { status: 403 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'
  const planConfig = PLANS[plan]

  if (!planConfig.priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 503 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    customer_email: user.email,
    metadata: {
      creator_id: creator.id,
      user_id: user.id,
      plan,
    },
    success_url: `${appUrl}/dashboard/earnings?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/earnings`,
  })

  return NextResponse.json({ checkoutUrl: session.url })
}

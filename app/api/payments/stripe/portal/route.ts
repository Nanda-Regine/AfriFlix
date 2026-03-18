import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { isCsrfSafe } from '@/lib/csrf'

/**
 * POST /api/payments/stripe/portal
 * Creates a Stripe Customer Portal session for managing subscription.
 */
export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: creator } = await supabase
    .from('creators')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!creator?.stripe_account_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'

  const session = await stripe.billingPortal.sessions.create({
    customer: creator.stripe_account_id,
    return_url: `${appUrl}/dashboard/earnings`,
  })

  return NextResponse.json({ portalUrl: session.url })
}

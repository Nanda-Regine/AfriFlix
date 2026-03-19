import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body      = await req.text()
  const sig       = req.headers.get('stripe-signature') ?? ''
  const secret    = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.warn('[stripe/webhook] Signature verification failed', err)
    return new NextResponse('Invalid signature', { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const creatorId = session.metadata?.creator_id
      const plan      = session.metadata?.plan
      const customerId = session.customer as string | null

      if (creatorId && plan) {
        await supabase
          .from('creators')
          .update({
            plan,
            stripe_account_id: customerId ?? undefined,
          })
          .eq('id', creatorId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const status = sub.status
      // Re-fetch the creator by stripe_account_id
      if (status === 'active') {
        const priceId = sub.items.data[0]?.price?.id
        const { PLANS } = await import('@/lib/stripe')
        const plan = Object.entries(PLANS).find(([, p]) => p.priceId === priceId)?.[0]
        if (plan) {
          await supabase
            .from('creators')
            .update({ plan })
            .eq('stripe_account_id', customerId)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      // Subscription cancelled — revert to free
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await supabase
        .from('creators')
        .update({ plan: 'free' })
        .eq('stripe_account_id', customerId)
      break
    }
  }

  return new NextResponse('OK', { status: 200 })
}

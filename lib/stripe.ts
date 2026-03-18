import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const PLANS = {
  creator_pro: {
    name: 'Creator Pro',
    priceId: process.env.STRIPE_CREATOR_PRO_PRICE_ID ?? '',
    amount: 9900, // R99 in cents
    currency: 'zar',
    features: ['Unlimited storage', 'Unlimited AI', 'Tips enabled', 'Priority discovery', 'Verified badge'],
  },
  label: {
    name: 'Label / Brand',
    priceId: process.env.STRIPE_LABEL_PRICE_ID ?? '',
    amount: 49900, // R499
    currency: 'zar',
    features: ['Multiple profiles', 'Sponsored placement', 'Campaign analytics', 'Priority support'],
  },
} as const

export type PlanKey = keyof typeof PLANS

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { UpgradeButton } from '@/components/payments/upgrade-button'
import { cn, formatCurrency, timeAgo } from '@/lib/utils'
import type { Tip } from '@/types'

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creators').select('*').eq('user_id', user.id).single()
  if (!creator) return <p className="text-ivory-dim">No creator profile found.</p>

  const { data: tips } = await supabase
    .from('tips')
    .select('*')
    .eq('to_creator_id', creator.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50)

  const typedTips = (tips as Tip[]) ?? []
  const totalGross = typedTips.reduce((s, t) => s + t.amount, 0)
  const totalNet = totalGross * 0.9

  const PLANS = [
    {
      name: 'Free',
      price: 'R0/month',
      current: creator.plan === 'free',
      features: ['5GB storage', '10 AI messages/month', 'Standard discovery', 'Fan features'],
    },
    {
      name: 'Creator Pro',
      price: 'R99/month',
      current: creator.plan === 'creator_pro',
      highlight: true,
      features: ['Unlimited storage', 'Unlimited AI assistant', 'Priority discovery', 'Tips enabled', 'Advanced analytics', 'Scheduling', 'Verified badge'],
    },
    {
      name: 'Label / Brand',
      price: 'R499/month',
      current: creator.plan === 'label' || creator.plan === 'brand',
      features: ['Multiple creator profiles', 'Sponsored placement', 'Campaign analytics', 'Featured collab listings', 'Priority support'],
    },
  ]

  return (
    <div className="max-w-4xl">
      <h1 className="font-syne font-bold text-2xl text-ivory mb-8">Earnings & Billing</h1>

      {/* Earnings summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Total Tips Received</p>
          <p className="font-syne font-bold text-3xl text-gold">{formatCurrency(totalGross)}</p>
        </div>
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Your Earnings (90%)</p>
          <p className="font-syne font-bold text-3xl text-ivory">{formatCurrency(totalNet)}</p>
        </div>
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Current Plan</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={creator.plan === 'free' ? 'dark' : 'gold'}>{creator.plan.replace('_', ' ')}</Badge>
          </div>
        </div>
      </div>

      {/* Tip history */}
      {creator.tips_enabled && (
        <div className="bg-black-card border border-white/5 rounded-xl overflow-hidden mb-10">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-syne font-semibold text-ivory">Tip History</h2>
          </div>
          {typedTips.length === 0 ? (
            <div className="text-center py-10 text-ivory-dim text-sm">
              No tips received yet. Keep creating!
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-mono text-ivory-dim uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-ivory-dim uppercase">Currency</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-ivory-dim uppercase">Provider</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-ivory-dim uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {typedTips.map(tip => (
                  <tr key={tip.id} className="border-b border-white/5">
                    <td className="px-5 py-3 font-mono text-gold font-semibold">{tip.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-ivory-dim">{tip.currency}</td>
                    <td className="px-5 py-3 text-ivory-dim capitalize">{tip.payment_provider}</td>
                    <td className="px-5 py-3 text-ivory-dim">{timeAgo(tip.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Upgrade plans */}
      <h2 className="font-syne font-semibold text-xl text-ivory mb-4">Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={cn(
              'bg-black-card border rounded-xl p-5 flex flex-col',
              plan.highlight ? 'border-gold' : 'border-white/10',
              plan.current && 'ring-1 ring-gold'
            )}
          >
            {plan.highlight && (
              <Badge variant="gold" className="self-start mb-3">Most Popular</Badge>
            )}
            <h3 className="font-syne font-bold text-ivory mb-1">{plan.name}</h3>
            <p className="text-gold font-mono text-lg mb-4">{plan.price}</p>
            <ul className="flex flex-col gap-2 text-sm text-ivory-dim flex-1 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-gold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            {plan.current ? (
              <div className="flex flex-col gap-2">
                <Badge variant="dark" className="self-center">Current Plan</Badge>
                {creator.stripe_account_id && (
                  <UpgradeButton variant="portal" label="Manage Billing" />
                )}
              </div>
            ) : plan.name === 'Free' ? (
              <Badge variant="dark" className="self-center text-xs">Downgrade via billing portal</Badge>
            ) : (
              <UpgradeButton
                plan={plan.name === 'Creator Pro' ? 'creator_pro' : 'label'}
                variant={plan.highlight ? 'gold' : 'outline'}
                label={`Upgrade — ${plan.price}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BankAccountForm } from '@/components/payments/bank-account-form'
import { formatCount } from '@/lib/utils'

export const metadata: Metadata = { title: 'Payouts — AfriFlix Dashboard' }

interface BankAccount {
  id: string
  account_type: string
  bank_name: string | null
  account_holder_name: string | null
  bank_account_type: string | null
  country: string
  currency: string
  mobile_provider: string | null
  mobile_number: string | null
  is_verified: boolean
}

interface Payout {
  id: string
  gross_amount: number
  net_amount: number
  currency: string
  status: string
  tip_count: number
  period_start: string
  period_end: string
  initiated_at: string
  completed_at: string | null
  failure_reason: string | null
}

function statusColor(status: string) {
  if (status === 'completed') return 'text-green-400'
  if (status === 'failed') return 'text-terra-light'
  if (status === 'processing') return 'text-gold'
  return 'text-ivory-dim'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending',
    processing: 'In transit',
    completed: 'Paid',
    failed: 'Failed',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

export default async function PayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/payouts')

  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, tips_enabled')
    .eq('user_id', user.id)
    .single()

  if (!creator) redirect('/dashboard/profile/setup')

  // Fetch bank account, unpaid tip total, and payout history in parallel
  const [bankRes, unpaidRes, payoutsRes] = await Promise.all([
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('creator_id', creator.id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('tips')
      .select('net_amount, amount')
      .eq('to_creator_id', creator.id)
      .eq('status', 'completed')
      .eq('is_paid', false),
    supabase
      .from('payouts')
      .select('*')
      .eq('creator_id', creator.id)
      .order('initiated_at', { ascending: false })
      .limit(20),
  ])

  const bankAccount = bankRes.data as BankAccount | null
  const unpaidTips = unpaidRes.data ?? []
  const payouts = (payoutsRes.data ?? []) as Payout[]

  const pendingBalance = unpaidTips.reduce((sum, t) => {
    return sum + Number(t.net_amount ?? Number(t.amount) * 0.9)
  }, 0)

  const totalPaid = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.net_amount), 0)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-1">Creator Hub</p>
        <h1 className="font-syne font-bold text-3xl text-ivory">Payouts</h1>
        <p className="text-ivory-dim mt-1">Your earnings are paid automatically on the 1st of each month.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">Pending balance</p>
          <p className="font-syne font-bold text-3xl text-gold">
            R{pendingBalance.toFixed(2)}
          </p>
          <p className="text-xs text-ivory-dim mt-1">{unpaidTips.length} tip(s) awaiting payout</p>
        </div>
        <div className="bg-black-card border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-2">All-time paid</p>
          <p className="font-syne font-bold text-3xl text-ivory">
            R{totalPaid.toFixed(2)}
          </p>
          <p className="text-xs text-ivory-dim mt-1">{payouts.filter(p => p.status === 'completed').length} payout(s)</p>
        </div>
      </div>

      {/* Next payout info */}
      <div className="bg-gold/10 border border-gold/20 rounded-xl px-5 py-4 flex items-center gap-3">
        <span className="text-xl">📅</span>
        <div>
          <p className="text-sm text-ivory font-syne font-medium">
            {pendingBalance >= 50
              ? `Your next payout of R${pendingBalance.toFixed(2)} will process on the 1st of next month`
              : `Minimum payout is R50 — keep earning!`}
          </p>
          <p className="text-xs text-ivory-dim mt-0.5">
            Sent via Flutterwave to your {bankAccount ? (bankAccount.account_type === 'bank' ? bankAccount.bank_name ?? 'bank account' : bankAccount.mobile_provider ?? 'mobile money') : 'payout destination'}
          </p>
        </div>
      </div>

      {/* Payout destination */}
      <div className="bg-black-card border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-semibold text-ivory">Payout destination</h2>
          {bankAccount && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              Configured
            </span>
          )}
        </div>

        {bankAccount ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-black-hover rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-lg">
                {bankAccount.account_type === 'bank' ? '🏦' : '📱'}
              </div>
              <div>
                <p className="font-syne font-medium text-ivory">
                  {bankAccount.account_type === 'bank'
                    ? bankAccount.bank_name ?? 'Bank account'
                    : `${bankAccount.mobile_provider} — ${bankAccount.mobile_number}`}
                </p>
                <p className="text-xs text-ivory-dim">
                  {bankAccount.account_type === 'bank'
                    ? `${bankAccount.bank_account_type ?? 'account'} · ${bankAccount.currency} · ${bankAccount.country}`
                    : bankAccount.country}
                  {bankAccount.account_holder_name ? ` · ${bankAccount.account_holder_name}` : ''}
                </p>
              </div>
            </div>
            <details className="group">
              <summary className="cursor-pointer text-sm text-ivory-dim hover:text-gold transition-colors list-none flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-open:rotate-90 transition-transform">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
                Update payout details
              </summary>
              <div className="mt-4">
                <BankAccountForm existing={bankAccount} />
              </div>
            </details>
          </div>
        ) : (
          <BankAccountForm />
        )}
      </div>

      {/* Payout history */}
      <div className="bg-black-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-syne font-semibold text-ivory">Payout history</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-ivory-dim text-sm">No payouts yet. Keep earning tips and your first payout will arrive on the 1st of next month.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {payouts.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-ivory font-mono">
                    {p.currency} {Number(p.net_amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-ivory-dim mt-0.5">
                    {p.tip_count} tip(s) · {new Date(p.period_start).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                  </p>
                  {p.failure_reason && (
                    <p className="text-xs text-terra-light mt-0.5">{p.failure_reason}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-syne font-medium ${statusColor(p.status)}`}>
                    {statusLabel(p.status)}
                  </p>
                  <p className="text-xs text-ivory-dim font-mono mt-0.5">
                    {new Date(p.initiated_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

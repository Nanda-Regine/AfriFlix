/**
 * Automated Monthly Payout Cron
 * Schedule: 1st of each month at 02:00 UTC via Vercel Cron (vercel.json) or external cron
 *
 * Flow:
 * 1. Find all creators with unpaid tips >= minimum threshold (R50)
 * 2. For each creator with a bank account on file, initiate a Flutterwave Transfer
 * 3. Mark tips as paid, create payout record
 * 4. Notify creator via notifications table
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MIN_PAYOUT_ZAR = 50
const CRON_SECRET = process.env.CRON_SECRET ?? ''
const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY ?? ''
const FLW_BASE = 'https://api.flutterwave.com/v3'

interface UnpaidGroup {
  creator_id: string
  total: number
  tip_ids: string[]
  currency: string
}

interface BankAccount {
  id: string
  account_type: string
  bank_name: string | null
  bank_code: string | null
  account_number: string | null
  account_holder_name: string | null
  bank_account_type: string | null
  mobile_provider: string | null
  mobile_number: string | null
  country: string
  currency: string
}

interface FlutterwaveTransferBody {
  account_bank?: string
  account_number?: string
  amount: number
  narration: string
  currency: string
  reference: string
  callback_url: string
  debit_currency: string
  meta?: { mobile_number?: string; mobile_operator?: string }[]
}

export async function POST(req: Request) {
  // Auth: Vercel Cron sets Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()
  const periodEnd = now.toISOString().slice(0, 10)
  // Period start = first day of current month
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // 1. Aggregate unpaid tips by creator
  const { data: unpaidTips, error: tipsError } = await supabase
    .from('tips')
    .select('id, to_creator_id, net_amount, amount, currency')
    .eq('status', 'completed')
    .eq('is_paid', false)

  if (tipsError) {
    console.error('Failed to fetch unpaid tips:', tipsError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!unpaidTips || unpaidTips.length === 0) {
    return NextResponse.json({ message: 'No unpaid tips', processed: 0 })
  }

  // Group by creator_id
  const grouped = new Map<string, UnpaidGroup>()
  for (const tip of unpaidTips) {
    const net = Number(tip.net_amount ?? tip.amount * 0.9)
    const existing = grouped.get(tip.to_creator_id)
    if (existing) {
      existing.total += net
      existing.tip_ids.push(tip.id)
    } else {
      grouped.set(tip.to_creator_id, {
        creator_id: tip.to_creator_id,
        total: net,
        tip_ids: [tip.id],
        currency: tip.currency ?? 'ZAR',
      })
    }
  }

  let processed = 0
  let skipped = 0
  const errors: string[] = []

  for (const [creatorId, group] of grouped) {
    // Skip if below minimum
    if (group.total < MIN_PAYOUT_ZAR) {
      skipped++
      continue
    }

    // Fetch bank account
    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .maybeSingle() as { data: BankAccount | null }

    if (!bankAccount) {
      skipped++
      continue
    }

    // Create payout record (pending)
    const payoutRef = `afriflix-payout-${creatorId.slice(0, 8)}-${Date.now()}`
    const { data: payout, error: payoutInsertError } = await supabase
      .from('payouts')
      .insert({
        creator_id: creatorId,
        bank_account_id: bankAccount.id,
        gross_amount: group.total,
        net_amount: group.total, // transfer fees handled by Flutterwave on their end
        currency: bankAccount.currency,
        status: 'processing',
        period_start: periodStart,
        period_end: periodEnd,
        tip_count: group.tip_ids.length,
      })
      .select('id')
      .single()

    if (payoutInsertError || !payout) {
      errors.push(`Failed to create payout record for creator ${creatorId}: ${payoutInsertError?.message}`)
      continue
    }

    // Initiate Flutterwave transfer
    let transferBody: FlutterwaveTransferBody
    if (bankAccount.account_type === 'bank') {
      transferBody = {
        account_bank: bankAccount.bank_code ?? bankAccount.bank_name ?? '',
        account_number: bankAccount.account_number ?? '',
        amount: Math.floor(group.total * 100) / 100,
        narration: `AfriFlix creator payout — ${group.tip_ids.length} tip(s)`,
        currency: bankAccount.currency,
        reference: payoutRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payouts/flutterwave-webhook`,
        debit_currency: bankAccount.currency,
      }
    } else {
      // Mobile money
      transferBody = {
        amount: Math.floor(group.total * 100) / 100,
        narration: `AfriFlix creator payout — ${group.tip_ids.length} tip(s)`,
        currency: bankAccount.currency,
        reference: payoutRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payouts/flutterwave-webhook`,
        debit_currency: bankAccount.currency,
        meta: [{
          mobile_number: bankAccount.mobile_number ?? '',
          mobile_operator: bankAccount.mobile_provider ?? '',
        }],
      }
    }

    let flwTransferId: string | null = null
    try {
      const flwRes = await fetch(`${FLW_BASE}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FLW_SECRET}`,
        },
        body: JSON.stringify(transferBody),
      })
      const flwData = await flwRes.json()
      if (flwData.status === 'success') {
        flwTransferId = String(flwData.data?.id ?? '')
      } else {
        throw new Error(flwData.message ?? 'Flutterwave transfer failed')
      }
    } catch (flwErr) {
      const msg = flwErr instanceof Error ? flwErr.message : 'Transfer API error'
      errors.push(`FLW transfer failed for creator ${creatorId}: ${msg}`)
      await supabase.from('payouts').update({ status: 'failed', failure_reason: msg }).eq('id', payout.id)
      continue
    }

    // Update payout with transfer ID
    await supabase
      .from('payouts')
      .update({ flutterwave_transfer_id: flwTransferId, flutterwave_reference: payoutRef })
      .eq('id', payout.id)

    // Mark tips as paid
    await supabase
      .from('tips')
      .update({ is_paid: true, payout_id: payout.id })
      .in('id', group.tip_ids)

    // Notify creator
    const { data: creatorUser } = await supabase
      .from('creators').select('user_id').eq('id', creatorId).single()
    if (creatorUser?.user_id) {
      await supabase.from('notifications').insert({
        user_id: creatorUser.user_id,
        type: 'tip_received',
        title: `Payout of ${bankAccount.currency} ${group.total.toFixed(2)} is on its way`,
        body: `${group.tip_ids.length} tip(s) from the last period have been sent to your ${bankAccount.bank_name ?? bankAccount.mobile_provider ?? 'account'}.`,
        link: '/dashboard/payouts',
      })
    }

    processed++
  }

  return NextResponse.json({
    message: 'Payout run complete',
    processed,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// Also support GET for manual trigger from dashboard (admin only — same auth)
export { POST as GET }

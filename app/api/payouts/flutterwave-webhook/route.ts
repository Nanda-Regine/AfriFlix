/**
 * Flutterwave Transfer Webhook
 * Receives status updates on initiated payouts and marks them complete/failed.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('verif-hash') ?? ''
  const secret = process.env.FLW_WEBHOOK_SECRET ?? ''

  // Verify Flutterwave webhook signature
  if (secret && signature !== secret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try { event = JSON.parse(body) } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const eventType = event.event as string
  if (!eventType?.startsWith('transfer.')) {
    return NextResponse.json({ ok: true })
  }

  const data = event.data as Record<string, unknown>
  const reference = data?.reference as string
  const status = data?.status as string
  const transferId = String(data?.id ?? '')

  if (!reference?.startsWith('afriflix-payout-')) {
    return NextResponse.json({ ok: true })
  }

  const supabase = await createClient()
  const newStatus = status === 'SUCCESSFUL' ? 'completed'
    : status === 'FAILED' ? 'failed'
    : 'processing'

  await supabase
    .from('payouts')
    .update({
      status: newStatus,
      ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(newStatus === 'failed' ? { failure_reason: (data?.complete_message as string) ?? 'Transfer failed' } : {}),
    })
    .eq('flutterwave_reference', reference)

  return NextResponse.json({ ok: true })
}

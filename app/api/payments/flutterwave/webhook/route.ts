import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    // Verify Flutterwave webhook signature
    const hash = req.headers.get('verif-hash')
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH

    if (!secretHash || hash !== secretHash) {
      console.warn('[flutterwave/webhook] Invalid hash')
      return new NextResponse('Forbidden', { status: 403 })
    }

    const event = await req.json()

    if (event.event !== 'charge.completed') {
      return new NextResponse('OK', { status: 200 })
    }

    const { data } = event
    const { status, tx_ref: reference, meta, amount } = data

    const tipId = meta?.tipId
    const creatorId = meta?.creatorId

    if (!tipId) return new NextResponse('Missing tip ID', { status: 400 })

    const supabase = await createClient()

    if (status === 'successful') {
      // Verify transaction with Flutterwave API before marking complete
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${data.id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      )
      const verified = await verifyRes.json()

      if (verified.status !== 'success' || verified.data.status !== 'successful') {
        console.warn('[flutterwave/webhook] Verification failed for', reference)
        return new NextResponse('Verification failed', { status: 400 })
      }

      await supabase.from('tips').update({ status: 'completed' }).eq('id', tipId)

      if (creatorId) {
        await supabase.rpc('increment_creator_tips', {
          p_creator_id: creatorId,
          p_amount: amount ?? 0,
        })
      }
    } else {
      await supabase.from('tips').update({ status: 'failed' }).eq('id', tipId)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[flutterwave/webhook]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// PayFast valid IPs (production + sandbox)
const PAYFAST_IPS = new Set([
  '197.97.145.144', '197.97.145.145', '197.97.145.146', '197.97.145.147',
  '197.97.145.148', '197.97.145.149', '197.97.145.150', '197.97.145.151',
  '41.74.179.194',  '41.74.179.195',  '41.74.179.196',  '41.74.179.197',
  '127.0.0.1', // sandbox
])

function verifySignature(params: Record<string, string>, passphrase?: string): boolean {
  const { signature, ...rest } = params
  const ordered = Object.keys(rest).sort().reduce<Record<string, string>>((acc, k) => {
    acc[k] = rest[k]
    return acc
  }, {})
  const payload = Object.entries(ordered)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&')
  const toHash = passphrase
    ? `${payload}&passphrase=${encodeURIComponent(passphrase.trim())}`
    : payload
  const expected = crypto.createHash('md5').update(toHash).digest('hex')
  return expected === signature
}

export async function POST(req: Request) {
  try {
    // x-real-ip is set by Nginx/Vercel directly; x-forwarded-for can be spoofed by callers
    const ip = (
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      ''
    ).trim()

    if (!PAYFAST_IPS.has(ip) && process.env.PAYFAST_SANDBOX !== 'true') {
      console.warn('[payfast/webhook] Blocked IP:', ip)
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.text()
    const params = Object.fromEntries(new URLSearchParams(body))

    const passphrase = process.env.PAYFAST_PASSPHRASE
    if (!verifySignature(params, passphrase)) {
      console.warn('[payfast/webhook] Signature mismatch')
      return new NextResponse('Invalid signature', { status: 400 })
    }

    const { payment_status, custom_str1: tipId, custom_str2: creatorId, amount_gross } = params

    if (!tipId) return new NextResponse('Missing tip ID', { status: 400 })

    const supabase = await createClient()

    if (payment_status === 'COMPLETE') {
      await supabase.from('tips').update({ status: 'completed' }).eq('id', tipId)

      // Increment creator stats
      if (creatorId) {
        await supabase.rpc('increment_creator_tips', {
          p_creator_id: creatorId,
          p_amount: parseFloat(amount_gross ?? '0'),
        })
      }
    } else if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
      await supabase.from('tips').update({ status: 'failed' }).eq('id', tipId)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[payfast/webhook]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

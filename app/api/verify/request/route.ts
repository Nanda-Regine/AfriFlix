import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: creator } = await supabase
    .from('creators')
    .select('id, african_verified')
    .eq('user_id', user.id)
    .single()

  if (!creator) return NextResponse.json({ error: 'Creator profile required' }, { status: 403 })
  if (creator.african_verified) return NextResponse.json({ error: 'Already verified' }, { status: 400 })

  // Check for pending request
  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id, status')
    .eq('creator_id', creator.id)
    .in('status', ['pending', 'under_review'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A verification request is already pending' }, { status: 400 })
  }

  const { method, social_proof_url, voucher_creator_id, notes } = await req.json()
  const validMethods = ['id_document', 'social_link', 'community_voucher']
  if (!validMethods.includes(method)) {
    return NextResponse.json({ error: 'Invalid verification method' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('verification_requests')
    .insert({
      creator_id: creator.id,
      method,
      social_proof_url: social_proof_url?.trim() || null,
      voucher_creator_id: voucher_creator_id || null,
      notes: notes?.trim().slice(0, 1000) || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

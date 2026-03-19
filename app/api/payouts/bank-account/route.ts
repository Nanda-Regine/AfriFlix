import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCsrfSafe } from '@/lib/csrf'

const HEADERS = { 'Cache-Control': 'no-store' }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: HEADERS })

  const { data: creator } = await supabase
    .from('creators').select('id').eq('user_id', user.id).single()
  if (!creator) return NextResponse.json({ error: 'No creator profile' }, { status: 404, headers: HEADERS })

  const { data } = await supabase
    .from('bank_accounts')
    .select('id, account_type, bank_name, account_holder_name, bank_account_type, country, currency, mobile_provider, mobile_number, is_verified, is_active, created_at')
    .eq('creator_id', creator.id)
    .eq('is_active', true)
    .maybeSingle()

  // Mask account number — only return last 4 digits
  return NextResponse.json({ data }, { headers: HEADERS })
}

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: HEADERS })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: HEADERS })

  const { data: creator } = await supabase
    .from('creators').select('id').eq('user_id', user.id).single()
  if (!creator) return NextResponse.json({ error: 'No creator profile' }, { status: 404, headers: HEADERS })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: HEADERS }) }

  const {
    account_type,
    bank_name, bank_code, account_number, account_holder_name,
    bank_account_type, branch_code,
    mobile_provider, mobile_number,
    country, currency,
  } = body as Record<string, string>

  // Validate required fields per type
  if (account_type === 'bank') {
    if (!bank_name || !account_number || !account_holder_name) {
      return NextResponse.json({ error: 'Bank name, account number and holder name are required' }, { status: 400, headers: HEADERS })
    }
    if (account_number.length < 6 || account_number.length > 20) {
      return NextResponse.json({ error: 'Invalid account number length' }, { status: 400, headers: HEADERS })
    }
  } else if (account_type === 'mobile_money') {
    if (!mobile_provider || !mobile_number) {
      return NextResponse.json({ error: 'Mobile provider and number are required' }, { status: 400, headers: HEADERS })
    }
  } else {
    return NextResponse.json({ error: 'Invalid account type' }, { status: 400, headers: HEADERS })
  }

  // Upsert (one bank account per creator)
  const { error } = await supabase
    .from('bank_accounts')
    .upsert({
      creator_id: creator.id,
      account_type: account_type || 'bank',
      bank_name: bank_name || null,
      bank_code: bank_code || null,
      account_number: account_number || null,
      account_holder_name: account_holder_name || null,
      bank_account_type: bank_account_type || 'cheque',
      branch_code: branch_code || null,
      mobile_provider: mobile_provider || null,
      mobile_number: mobile_number || null,
      country: country || 'ZA',
      currency: currency || 'ZAR',
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'creator_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: HEADERS })
  return NextResponse.json({ success: true }, { headers: HEADERS })
}

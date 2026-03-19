import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/security'

const NO_STORE = { 'Cache-Control': 'no-store' }
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE })
  }
  return { userId: user.id }
}

// GET /api/admin/reports?status=pending&limit=50
export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, reason, details, status, created_at,
      work:works(id, title, category, creator_id)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE })
  return NextResponse.json(data ?? [], { headers: NO_STORE })
}

// PATCH /api/admin/reports  { id, status: 'reviewed'|'actioned'|'dismissed' }
export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => null)
  if (!body?.id || !isValidUUID(body.id)) {
    return NextResponse.json({ error: 'Valid report id required' }, { status: 400, headers: NO_STORE })
  }
  const allowed = ['reviewed', 'actioned', 'dismissed']
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: NO_STORE })
  }

  const supabase = await createClient()

  // If actioning (removing content), also set work status to 'removed'
  if (body.status === 'actioned' && body.remove_work) {
    const { data: report } = await supabase
      .from('reports')
      .select('work_id')
      .eq('id', body.id)
      .single()

    if (report?.work_id) {
      await supabase
        .from('works')
        .update({ status: 'removed' })
        .eq('id', report.work_id)
    }
  }

  const { error } = await supabase
    .from('reports')
    .update({ status: body.status })
    .eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE })
  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id)) return new NextResponse(null, { status: 204 })

  const supabase = await createClient()
  // Use the RPC to increment atomically — fire-and-forget, no error surfacing needed
  await supabase.rpc('increment_view_count', { work_id_input: id })

  return new NextResponse(null, { status: 204 })
}

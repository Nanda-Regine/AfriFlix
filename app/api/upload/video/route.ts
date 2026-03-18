import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createStreamDirectUpload } from '@/lib/cloudflare'
import { isCsrfSafe } from '@/lib/csrf'

/**
 * POST /api/upload/video
 * Returns a Cloudflare Stream direct-upload URL.
 * The client uploads the video directly to Cloudflare using TUS — no server proxy.
 */
export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Only creators can upload
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!creator) return NextResponse.json({ error: 'Creator profile required' }, { status: 403 })

  try {
    const { uploadUrl, uid } = await createStreamDirectUpload({
      creator: creator.id,
      maxDurationSeconds: 14400,
    })
    return NextResponse.json({ uploadUrl, uid })
  } catch (err) {
    console.error('[upload/video]', err)
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 502 })
  }
}

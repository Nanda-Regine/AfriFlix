import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getR2PresignedUrl } from '@/lib/cloudflare'
import { isCsrfSafe } from '@/lib/csrf'
import { randomUUID } from 'crypto'

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac',
  'audio/aac', 'audio/x-m4a', 'audio/mp4',
]
const MAX_AUDIO_BYTES = 200 * 1024 * 1024 // 200MB

/**
 * POST /api/upload/audio  { contentType, sizeBytes }
 * Returns a presigned PUT URL for Cloudflare R2.
 * Client uploads audio directly to R2.
 */
export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!creator) return NextResponse.json({ error: 'Creator profile required' }, { status: 403 })

  const { contentType, sizeBytes } = await req.json()

  if (!ALLOWED_AUDIO_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 })
  }
  if (sizeBytes && sizeBytes > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'File too large (max 200MB)' }, { status: 400 })
  }

  const key = `audio/${creator.id}/${randomUUID()}`
  try {
    const { uploadUrl, publicUrl } = await getR2PresignedUrl({ key, contentType })
    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (err) {
    console.error('[upload/audio]', err)
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 502 })
  }
}

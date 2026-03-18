import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getR2PresignedUrl } from '@/lib/cloudflare'
import { isCsrfSafe } from '@/lib/csrf'
import { randomUUID } from 'crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/upload/image  { contentType, sizeBytes, purpose }
 * purpose: 'avatar' | 'banner' | 'cover' | 'thumbnail'
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

  const { contentType, sizeBytes, purpose = 'cover' } = await req.json()

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Unsupported image format (JPEG, PNG, WebP, AVIF, GIF)' }, { status: 400 })
  }
  if (sizeBytes && sizeBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
  }

  const purposes = ['avatar', 'banner', 'cover', 'thumbnail']
  const safePurpose = purposes.includes(purpose) ? purpose : 'cover'
  const key = `images/${safePurpose}/${creator.id}/${randomUUID()}`

  try {
    const { uploadUrl, publicUrl } = await getR2PresignedUrl({ key, contentType })
    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (err) {
    console.error('[upload/image]', err)
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 502 })
  }
}

/**
 * Cloudflare Stream + R2 utilities
 *
 * Stream: Video uploads/streaming
 * R2: Audio + image storage (S3-compatible API)
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ─── Cloudflare R2 client ───────────────────────────────────────────────────

function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
  if (!accountId) throw new Error('CLOUDFLARE_R2_ACCOUNT_ID not set')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

/**
 * Generate a presigned PUT URL for R2.
 * Client uploads directly to R2 — no server proxy needed.
 */
export async function getR2PresignedUrl(params: {
  key: string
  contentType: string
  expiresIn?: number
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'afriflix-media'
  const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? 'https://media.afriflix.co.za'
  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  })

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresIn ?? 3600,
  })

  return {
    uploadUrl,
    publicUrl: `${publicBase}/${params.key}`,
  }
}

// ─── Cloudflare Stream ──────────────────────────────────────────────────────

const STREAM_BASE = 'https://api.cloudflare.com/client/v4/accounts'

function streamHeaders() {
  return {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Create a direct-upload URL via Cloudflare Stream TUS protocol.
 * The client then uploads the video directly to Cloudflare — no server proxy.
 * Returns the upload URL and the stream video UID to store in the DB.
 */
export async function createStreamDirectUpload(params: {
  maxDurationSeconds?: number
  requireSignedURLs?: boolean
  creator?: string
}): Promise<{ uploadUrl: string; uid: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not set')

  const res = await fetch(
    `${STREAM_BASE}/${accountId}/stream/direct_upload`,
    {
      method: 'POST',
      headers: streamHeaders(),
      body: JSON.stringify({
        maxDurationSeconds: params.maxDurationSeconds ?? 14400, // 4 hours
        requireSignedURLs: params.requireSignedURLs ?? false,
        creator: params.creator,
        // Webhook — optional: notify when encoding is complete
        // meta: { creator: params.creator },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudflare Stream error: ${err}`)
  }

  const json = await res.json()
  return {
    uploadUrl: json.result.uploadURL,
    uid: json.result.uid,
  }
}

/**
 * Get stream video details (status, playback URLs, thumbnail).
 */
export async function getStreamVideo(uid: string): Promise<{
  uid: string
  status: string
  playback: { hls: string; dash: string } | null
  thumbnail: string | null
  duration: number | null
}> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not set')

  const res = await fetch(`${STREAM_BASE}/${accountId}/stream/${uid}`, {
    headers: streamHeaders(),
  })

  if (!res.ok) throw new Error(`Stream video not found: ${uid}`)
  const json = await res.json()
  const r = json.result

  return {
    uid: r.uid,
    status: r.status?.state ?? 'unknown',
    playback: r.playback ? { hls: r.playback.hls, dash: r.playback.dash } : null,
    thumbnail: r.thumbnail ?? null,
    duration: r.duration ?? null,
  }
}

// ─── Cloudflare Stream Live ─────────────────────────────────────────────────

export async function createLiveInput(params: {
  name: string
  creatorId: string
}): Promise<{ uid: string; rtmpsUrl: string; rtmpsKey: string; webRtcUrl: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not set')

  const res = await fetch(`${STREAM_BASE}/${accountId}/stream/live_inputs`, {
    method: 'POST',
    headers: streamHeaders(),
    body: JSON.stringify({
      meta: { name: params.name, creator_id: params.creatorId },
      recording: { mode: 'automatic', timeoutSeconds: 10 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudflare Live Input error: ${err}`)
  }

  const json = await res.json()
  const r = json.result
  return {
    uid: r.uid,
    rtmpsUrl: r.rtmps?.url ?? '',
    rtmpsKey: r.rtmps?.streamKey ?? '',
    webRtcUrl: r.webRTC?.url ?? '',
  }
}

export async function getLiveInput(uid: string): Promise<{
  uid: string
  status: string
  created: string
}> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not set')

  const res = await fetch(`${STREAM_BASE}/${accountId}/stream/live_inputs/${uid}`, {
    headers: streamHeaders(),
  })
  if (!res.ok) throw new Error('Live input not found')
  const json = await res.json()
  return {
    uid: json.result.uid,
    status: json.result.status ?? 'idle',
    created: json.result.created,
  }
}

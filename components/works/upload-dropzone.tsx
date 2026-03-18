'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ContentCategory } from '@/types'

interface UploadResult {
  videoUrl?: string
  audioUrl?: string
  imageUrl?: string
  streamUid?: string
}

interface Props {
  category: ContentCategory | null
  onUploadComplete: (result: UploadResult) => void
}

const VIDEO_CATS: ContentCategory[] = ['film', 'dance', 'comedy', 'theatre']
const AUDIO_CATS: ContentCategory[] = ['music']

function isVideo(cat: ContentCategory | null) { return cat ? VIDEO_CATS.includes(cat) : false }
function isAudio(cat: ContentCategory | null) { return cat ? AUDIO_CATS.includes(cat) : false }

export function UploadDropzone({ category, onUploadComplete }: Props) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus]     = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [filename, setFilename] = useState('')
  const [error, setError]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = isVideo(category)
    ? 'video/*'
    : isAudio(category)
    ? 'audio/*'
    : category === 'writing'
    ? '.txt,.md,.docx,.pdf'
    : 'image/*,video/*'

  async function uploadFile(file: File) {
    setStatus('uploading')
    setProgress(0)
    setError('')
    setFilename(file.name)

    try {
      if (isVideo(category)) {
        // 1. Get Cloudflare Stream direct-upload URL
        const initRes = await fetch('/api/upload/video', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        if (!initRes.ok) throw new Error('Could not get upload URL')
        const { uploadUrl, uid } = await initRes.json()

        // 2. Upload to Cloudflare Stream via TUS (simple PUT here for small files; use tus-js-client for large)
        await uploadWithProgress(file, uploadUrl, setProgress)

        onUploadComplete({
          videoUrl: `https://customer-${uid}.cloudflarestream.com/${uid}/manifest/video.m3u8`,
          streamUid: uid,
        })

      } else if (isAudio(category)) {
        // 1. Get R2 presigned URL
        const initRes = await fetch('/api/upload/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
        })
        if (!initRes.ok) throw new Error('Could not get upload URL')
        const { uploadUrl, publicUrl } = await initRes.json()

        // 2. PUT directly to R2
        await uploadWithProgress(file, uploadUrl, setProgress, file.type)
        onUploadComplete({ audioUrl: publicUrl })

      } else {
        // Image / cover art
        const initRes = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type || 'image/jpeg', sizeBytes: file.size, purpose: 'cover' }),
        })
        if (!initRes.ok) throw new Error('Could not get upload URL')
        const { uploadUrl, publicUrl } = await initRes.json()

        await uploadWithProgress(file, uploadUrl, setProgress, file.type)
        onUploadComplete({ imageUrl: publicUrl })
      }

      setStatus('done')
    } catch (err) {
      console.error('[upload]', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div>
      <label
        className={cn(
          'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all',
          dragging ? 'border-gold bg-gold/10' : 'border-white/20 bg-black-card hover:border-gold/40'
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {status === 'idle' && (
          <>
            <span className="text-4xl mb-3">{isVideo(category) ? '🎬' : isAudio(category) ? '🎵' : '📁'}</span>
            <p className="font-syne text-ivory-mid">Click or drag to upload</p>
            <p className="text-xs text-ivory-dim mt-1">{accept} accepted</p>
          </>
        )}
        {status === 'uploading' && (
          <div className="w-full px-8 text-center">
            <p className="font-syne text-ivory-mid mb-3 truncate text-sm">{filename}</p>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div
                className="bg-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-mono text-ivory-dim">{progress}% — uploading to Cloudflare</p>
          </div>
        )}
        {status === 'done' && (
          <>
            <span className="text-4xl mb-3">✅</span>
            <p className="font-syne text-ivory-mid">Upload complete</p>
            <p className="text-xs text-ivory-dim mt-1 truncate px-4">{filename}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <span className="text-4xl mb-3">❌</span>
            <p className="font-syne text-terra-light">{error}</p>
            <p className="text-xs text-ivory-dim mt-1">Click to try again</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
      </label>

      <p className="text-xs text-ivory-dim mt-3 text-center">
        Files upload directly to Cloudflare — optimised for African bandwidth
      </p>
    </div>
  )
}

// XHR-based upload to track progress
function uploadWithProgress(
  file: File,
  url: string,
  onProgress: (pct: number) => void,
  contentType?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    if (contentType) xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.send(file)
  })
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LiveStream {
  id: string
  title: string
  cloudflare_live_uid: string
  rtmps_url: string
  rtmps_key: string
  webrtc_url: string
  status: string
}

export default function LivePage() {
  const [title, setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [creating, setCreating] = useState(false)
  const [stream, setStream]     = useState<LiveStream | null>(null)
  const [error, setError]       = useState('')
  const [keyVisible, setKeyVisible] = useState(false)

  async function createStream() {
    if (!title.trim()) return
    setCreating(true)
    setError('')

    const res = await fetch('/api/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create stream')
    } else {
      setStream(data)
    }
    setCreating(false)
  }

  if (stream) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-syne font-bold text-2xl text-ivory">{stream.title}</h1>
          <Badge variant={stream.status === 'live' ? 'terra' : 'dark'}>
            {stream.status === 'live' ? '● LIVE' : 'Idle'}
          </Badge>
        </div>

        {/* Stream settings */}
        <div className="bg-black-card border border-white/5 rounded-xl p-6 mb-6">
          <h2 className="font-syne font-semibold text-ivory mb-5">Streaming settings</h2>
          <p className="text-xs text-ivory-dim mb-6">
            Use any RTMPS-compatible streaming software (OBS Studio, Streamlabs, XSplit).
            Point your encoder to these settings:
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-1.5">RTMPS URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-ivory font-mono break-all">
                  {stream.rtmps_url}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(stream.rtmps_url)}
                  className="px-3 py-2 text-xs border border-white/10 rounded-lg text-ivory-dim hover:text-ivory transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-1.5">Stream Key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-ivory font-mono break-all">
                  {keyVisible ? stream.rtmps_key : '•'.repeat(40)}
                </code>
                <button
                  onClick={() => setKeyVisible(v => !v)}
                  className="px-3 py-2 text-xs border border-white/10 rounded-lg text-ivory-dim hover:text-ivory transition-colors"
                >
                  {keyVisible ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(stream.rtmps_key)}
                  className="px-3 py-2 text-xs border border-white/10 rounded-lg text-ivory-dim hover:text-ivory transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-terra-light mt-1.5">Keep this private — it controls your stream.</p>
            </div>
          </div>
        </div>

        {/* Watch URL */}
        <div className="bg-black-card border border-white/5 rounded-xl p-6">
          <h2 className="font-syne font-semibold text-ivory mb-3">Share with your audience</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-ivory font-mono break-all">
              {process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'}/live/{stream.id}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'}/live/${stream.id}`)}
              className="px-3 py-2 text-xs border border-white/10 rounded-lg text-ivory-dim hover:text-ivory transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => setStream(null)}>Create another stream</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-syne font-bold text-2xl text-ivory mb-2">Go Live</h1>
      <p className="text-ivory-dim mb-8">
        Stream to your audience using OBS, Streamlabs, or any RTMPS encoder.
        Your stream will be available live on AfriFlix.
      </p>

      <div className="flex flex-col gap-5">
        <Input
          label="Stream title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What are you streaming today?"
          required
        />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Tell viewers what this stream is about"
          rows={3}
        />

        <div>
          <label className="block text-sm font-syne text-ivory-mid mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {['film', 'music', 'dance', 'poetry', 'comedy', 'theatre', 'writing', 'visual_art'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-pill border text-sm transition-all capitalize',
                  category === cat
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/10 text-ivory-dim hover:border-white/20'
                )}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-terra-light font-mono">{error}</p>}

        <Button variant="gold" loading={creating} disabled={!title.trim()} onClick={createStream}>
          Create Stream
        </Button>
      </div>
    </div>
  )
}

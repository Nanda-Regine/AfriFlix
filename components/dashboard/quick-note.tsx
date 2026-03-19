'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  creatorId: string
  creatorName: string
  creatorAvatar: string | null
}

export function DashboardQuickNote({ creatorName, creatorAvatar }: Props) {
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [done, setDone] = useState(false)
  const [open, setOpen] = useState(false)

  async function post() {
    if (!content.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (res.ok) {
        setContent('')
        setOpen(false)
        setDone(true)
        setTimeout(() => setDone(false), 3000)
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-syne font-semibold text-ivory">Post a Note</h2>
        {done && <span className="text-xs text-green-400 font-mono">Note posted ✓</span>}
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-black-card border border-white/5 rounded-xl hover:border-gold/20 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-gold/20 overflow-hidden flex-shrink-0">
            {creatorAvatar ? (
              <Image src={creatorAvatar} alt={creatorName} width={32} height={32} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold text-xs font-syne font-bold">
                {creatorName[0]}
              </div>
            )}
          </div>
          <span className="text-sm text-ivory-dim/60 group-hover:text-ivory-dim transition-colors">
            Share a thought with your followers...
          </span>
        </button>
      ) : (
        <div className="bg-black-card border border-gold/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 overflow-hidden flex-shrink-0 mt-0.5">
              {creatorAvatar ? (
                <Image src={creatorAvatar} alt={creatorName} width={36} height={36} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gold text-sm font-syne font-bold">
                  {creatorName[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post() }}
                placeholder="Share a quick thought, update, or behind-the-scenes moment..."
                rows={3}
                maxLength={1000}
                className="w-full bg-transparent text-ivory text-sm placeholder:text-ivory-dim/50 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ivory-dim font-mono">{content.length}/1000</span>
                  <span className="text-xs text-ivory-dim/50">⌘+Enter to post</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setOpen(false); setContent('') }}
                    className="px-3 py-1.5 text-xs text-ivory-dim hover:text-ivory transition-colors font-syne"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={post}
                    disabled={posting || !content.trim()}
                    className="px-4 py-1.5 bg-gold text-black rounded-lg text-sm font-syne font-semibold disabled:opacity-40 hover:bg-gold-light transition-colors"
                  >
                    {posting ? 'Posting...' : 'Post Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

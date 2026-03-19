'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'

interface Note {
  id: string
  creator_id: string
  content: string
  image_url: string | null
  link_url: string | null
  link_title: string | null
  heart_count: number
  comment_count: number
  created_at: string
}

interface Props {
  creatorId: string
  creatorName: string
  creatorAvatar: string | null
  isOwner?: boolean
  initialNotes?: Note[]
}

export function CreatorNotes({ creatorId, creatorName, creatorAvatar, isOwner, initialNotes = [] }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [hearted, setHearted] = useState<Set<string>>(new Set())
  const { user } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    if (initialNotes.length === 0) fetchNotes()

    // Realtime subscription for new notes
    const channel = supabase
      .channel(`notes:${creatorId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'creator_notes',
        filter: `creator_id=eq.${creatorId}`,
      }, payload => {
        setNotes(prev => [payload.new as Note, ...prev])
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'creator_notes',
        filter: `creator_id=eq.${creatorId}`,
      }, payload => {
        setNotes(prev => prev.filter(n => n.id !== (payload.old as Note).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [creatorId])

  async function fetchNotes() {
    const res = await fetch(`/api/notes?creator_id=${creatorId}&limit=20`)
    if (res.ok) {
      const data = await res.json()
      setNotes(data.notes)
    }
  }

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
        setShowForm(false)
      }
    } finally {
      setPosting(false)
    }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  function toggleHeart(id: string) {
    setHearted(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (notes.length === 0 && !isOwner) return null

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider">Notes</p>
        {isOwner && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-xs text-gold hover:text-gold-light transition-colors font-syne"
          >
            {showForm ? 'Cancel' : '+ New note'}
          </button>
        )}
      </div>

      {/* Post form (owner only) */}
      {isOwner && showForm && (
        <div className="bg-black-card border border-gold/20 rounded-xl p-4 mb-4">
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
                placeholder="Share a quick thought with your followers..."
                rows={3}
                maxLength={1000}
                className="w-full bg-transparent text-ivory text-sm placeholder:text-ivory-dim/50 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-ivory-dim font-mono">{content.length}/1000</span>
                <button
                  onClick={post}
                  disabled={posting || !content.trim()}
                  className="px-4 py-1.5 bg-gold text-black rounded-lg text-sm font-syne font-semibold disabled:opacity-40 hover:bg-gold-light transition-colors"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes feed */}
      {notes.length === 0 ? (
        isOwner && (
          <p className="text-sm text-ivory-dim text-center py-6">
            Share quick updates, behind-the-scenes moments, or thoughts between your big releases.
          </p>
        )
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-black-card border border-white/5 rounded-xl p-4 group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/20 overflow-hidden flex-shrink-0">
                  {creatorAvatar ? (
                    <Image src={creatorAvatar} alt={creatorName} width={32} height={32} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold text-xs font-syne font-bold">
                      {creatorName[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-syne font-semibold text-ivory">{creatorName}</span>
                    <span className="text-xs text-ivory-dim font-mono">{timeAgo(note.created_at)}</span>
                  </div>

                  <p className="text-sm text-ivory-mid leading-relaxed whitespace-pre-wrap break-words">
                    {note.content}
                  </p>

                  {note.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden max-h-64 relative">
                      <Image src={note.image_url} alt="" width={600} height={300} className="object-cover w-full" />
                    </div>
                  )}

                  {note.link_url && (
                    <a
                      href={note.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2 px-3 py-2 bg-black-hover border border-white/5 rounded-lg text-xs text-gold hover:border-gold/20 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {note.link_title ?? note.link_url}
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => user && toggleHeart(note.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${hearted.has(note.id) ? 'text-terra-light' : 'text-ivory-dim hover:text-terra-light'}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={hearted.has(note.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span className="font-mono">{note.heart_count + (hearted.has(note.id) ? 1 : 0)}</span>
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-xs text-ivory-dim/40 hover:text-terra-light opacity-0 group-hover:opacity-100 transition-all ml-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

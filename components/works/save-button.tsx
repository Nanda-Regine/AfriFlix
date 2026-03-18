'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

interface Collection {
  id: string
  title: string
  work_count: number
}

export function SaveButton({ workId }: { workId: string }) {
  const { user } = useAuthStore()
  const [open, setOpen]           = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [saved, setSaved]         = useState<Set<string>>(new Set())
  const [loading, setLoading]     = useState(false)
  const [newTitle, setNewTitle]   = useState('')
  const [creating, setCreating]   = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function openMenu() {
    if (!user) { window.location.href = '/login'; return }
    setOpen(o => !o)
    if (collections.length === 0) {
      setLoading(true)
      const res = await fetch('/api/collections')
      const data = await res.json()
      setCollections(data ?? [])
      setLoading(false)
    }
  }

  async function toggleCollection(col: Collection) {
    const isSaved = saved.has(col.id)
    setSaved(prev => {
      const next = new Set(prev)
      isSaved ? next.delete(col.id) : next.add(col.id)
      return next
    })

    if (isSaved) {
      await fetch(`/api/collections/${col.id}/works?work_id=${workId}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/collections/${col.id}/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_id: workId }),
      })
    }
  }

  async function createCollection() {
    if (!newTitle.trim()) return
    setCreating(true)
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    const col = await res.json()
    setCollections(prev => [col, ...prev])
    setNewTitle('')
    setShowNew(false)
    setCreating(false)
    // Immediately save the work to the new collection
    await toggleCollection(col)
  }

  const anySelected = saved.size > 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openMenu}
        className={cn(
          'flex items-center gap-1.5 text-sm font-mono transition-colors',
          anySelected ? 'text-gold' : 'text-ivory-dim hover:text-ivory'
        )}
        aria-label="Save to collection"
      >
        <BookmarkIcon filled={anySelected} />
        <span>{anySelected ? 'Saved' : 'Save'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-64 bg-black-card border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs font-syne font-semibold text-ivory-mid uppercase tracking-wider">Save to collection</p>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loading && (
              <p className="text-xs text-ivory-dim text-center py-4">Loading...</p>
            )}
            {!loading && collections.length === 0 && (
              <p className="text-xs text-ivory-dim text-center py-4">No collections yet</p>
            )}
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => toggleCollection(col)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-black-hover transition-colors"
              >
                <span className="text-sm text-ivory font-syne text-left">{col.title}</span>
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                  saved.has(col.id) ? 'bg-gold border-gold' : 'border-white/20'
                )}>
                  {saved.has(col.id) && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 p-3">
            {showNew ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createCollection()}
                  placeholder="Collection name"
                  className="flex-1 bg-black-hover border border-white/10 rounded-lg px-3 py-1.5 text-sm text-ivory placeholder:text-ivory-dim focus:outline-none focus:border-gold/40"
                />
                <button
                  onClick={createCollection}
                  disabled={creating || !newTitle.trim()}
                  className="px-3 py-1.5 bg-gold text-black text-xs font-syne font-semibold rounded-lg disabled:opacity-50"
                >
                  {creating ? '...' : 'Add'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNew(true)}
                className="w-full text-left text-xs text-gold hover:text-gold-light transition-colors font-syne"
              >
                + New collection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

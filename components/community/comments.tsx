'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface CommentUser {
  display_name: string
  username: string
  avatar_url: string | null
}

interface Comment {
  id: string
  content: string
  heart_count: number
  timestamp_ref: number | null
  parent_id: string | null
  created_at: string
  user: CommentUser
  replies?: Comment[]
}

interface CommentsProps {
  workId: string
  initialCount?: number
}

export function Comments({ workId, initialCount = 0 }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [count, setCount] = useState(initialCount)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadComments()

    // Supabase Realtime — live new comments
    const supabase = createClient()
    const channel = supabase
      .channel(`comments:${workId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `work_id=eq.${workId}`,
      }, () => {
        loadComments()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workId])

  async function loadComments() {
    setLoading(true)
    const res = await fetch(`/api/comments?work_id=${workId}`)
    if (res.ok) {
      const data: Comment[] = await res.json()
      setComments(data)
      setCount(data.length)
    }
    setLoading(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        work_id: workId,
        content: text.trim(),
        parent_id: replyTo?.id ?? null,
      }),
    })

    if (res.status === 401) {
      window.location.href = '/login?next=' + window.location.pathname
      return
    }

    if (res.ok) {
      setText('')
      setReplyTo(null)
      loadComments()
    }
    setSubmitting(false)
  }

  function startReply(id: string, name: string) {
    setReplyTo({ id, name })
    inputRef.current?.focus()
  }

  async function deleteComment(id: string) {
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    loadComments()
  }

  return (
    <div className="mt-10">
      <h2 className="font-syne font-semibold text-lg text-ivory mb-6">
        {count > 0 ? `${count} Comment${count !== 1 ? 's' : ''}` : 'Comments'}
      </h2>

      {/* Input */}
      <form onSubmit={submit} className="mb-8">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-ivory-dim">
            <span>Replying to <span className="text-gold">@{replyTo.name}</span></span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-ivory-dim hover:text-ivory ml-1">✕</button>
          </div>
        )}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex-shrink-0 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold/60">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Share your thoughts…"
              rows={2}
              maxLength={1000}
              className="w-full bg-black-card border border-white/5 rounded-xl px-4 py-3 text-sm text-ivory placeholder:text-ivory-dim/50 resize-none focus:outline-none focus:border-gold/30 transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-mono text-ivory-dim">{text.length}/1000</span>
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="px-4 py-1.5 bg-gold text-black text-xs font-syne font-semibold rounded-lg disabled:opacity-40 hover:bg-gold-light transition-colors"
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-32" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-ivory-dim text-sm">Be the first to comment</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentRow
              key={comment.id}
              comment={comment}
              onReply={startReply}
              onDelete={deleteComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentRow({
  comment,
  onReply,
  onDelete,
  depth = 0,
}: {
  comment: Comment
  onReply: (id: string, name: string) => void
  onDelete: (id: string) => void
  depth?: number
}) {
  const [hearted, setHearted] = useState(false)
  const [heartCount, setHeartCount] = useState(comment.heart_count)

  async function toggleHeart() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (hearted) {
      await supabase.from('comment_hearts').delete()
        .eq('user_id', user.id).eq('comment_id', comment.id)
      setHeartCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from('comment_hearts').insert({ user_id: user.id, comment_id: comment.id })
      setHeartCount(c => c + 1)
    }
    setHearted(h => !h)
  }

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-11')}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gold/20 overflow-hidden flex-shrink-0">
        {comment.user?.avatar_url ? (
          <Image src={comment.user.avatar_url} alt={comment.user.display_name} width={32} height={32} className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-syne font-bold text-gold">
            {comment.user?.display_name?.[0] ?? '?'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <Link href={`/creator/${comment.user?.username}`} className="text-sm font-syne font-semibold text-ivory hover:text-gold transition-colors">
            {comment.user?.display_name ?? 'Unknown'}
          </Link>
          <span className="text-[11px] font-mono text-ivory-dim">{timeAgo(comment.created_at)}</span>
          {comment.timestamp_ref != null && (
            <span className="text-[11px] font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded">
              {Math.floor(comment.timestamp_ref / 60)}:{String(comment.timestamp_ref % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-ivory-mid leading-relaxed mb-2">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleHeart}
            className={cn('flex items-center gap-1 text-[11px] font-mono transition-colors', hearted ? 'text-terra-light' : 'text-ivory-dim hover:text-terra-light')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={hearted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {heartCount > 0 && heartCount}
          </button>

          {depth === 0 && (
            <button
              onClick={() => onReply(comment.id, comment.user?.username ?? '')}
              className="text-[11px] font-mono text-ivory-dim hover:text-ivory transition-colors"
            >
              Reply
            </button>
          )}

          <button
            onClick={() => onDelete(comment.id)}
            className="text-[11px] font-mono text-ivory-dim hover:text-red-400 transition-colors ml-auto"
          >
            Delete
          </button>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => (
              <CommentRow key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} depth={1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

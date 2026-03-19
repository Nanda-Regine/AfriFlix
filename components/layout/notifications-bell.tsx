'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { timeAgo } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  link_url: string | null
  actor_avatar_url: string | null
  is_read: boolean
  created_at: string
  metadata?: {
    work_id?: string
    creator_id?: string
    thumbnail?: string
    category?: string
  } | null
}

const TYPE_ICON: Record<string, string> = {
  tip_received: '💰',
  new_follower: '👤',
  new_work: '🎬',
  collab_application: '🤝',
  collab_accepted: '🎉',
  comment_on_work: '💬',
  comment_reply: '↩️',
  heart_milestone: '❤️',
  badge_awarded: '🏆',
  payout_processed: '💸',
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 30))
        setUnread(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function fetchNotifications() {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications)
      setUnread(data.unread)
    }
  }

  async function handleOpen() {
    setOpen(prev => !prev)
    if (!open && unread > 0) {
      setUnread(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      await fetch('/api/notifications', { method: 'PATCH' })
    }
  }

  if (!user) return null

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative p-2 text-ivory-mid hover:text-ivory transition-colors"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-terra text-white text-[10px] font-mono font-bold flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-black-mid border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-fade-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="font-syne font-semibold text-ivory text-sm">Notifications</p>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  setUnread(0)
                  setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                  await fetch('/api/notifications', { method: 'PATCH' })
                }}
                className="text-xs text-ivory-dim hover:text-gold transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-ivory-dim text-sm">Nothing yet — we'll let you know when something happens.</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n, onClose }: { notification: Notification; onClose: () => void }) {
  const inner = (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-gold/5' : ''}`}>
      <div className="w-9 h-9 rounded-full bg-black-card flex items-center justify-center flex-shrink-0 text-base">
        {TYPE_ICON[n.type] ?? '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ivory leading-snug line-clamp-2">{n.title}</p>
        {n.body && <p className="text-xs text-ivory-dim mt-0.5 line-clamp-1">{n.body}</p>}
        <p className="text-[11px] text-ivory-dim/60 mt-1 font-mono">{timeAgo(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-1.5" />
      )}
    </div>
  )

  const href = n.link ?? n.link_url ?? (n.metadata?.work_id ? `/work/${n.metadata.work_id}` : null)
  if (href) {
    return <Link href={href} onClick={onClose}>{inner}</Link>
  }
  return inner
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

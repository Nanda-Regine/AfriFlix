'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCount, timeAgo, generateCardBg } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Work, WorkStatus } from '@/types'

interface WorksManagerProps {
  works: Work[]
}

const STATUS_BADGE: Record<WorkStatus, { variant: 'gold' | 'terra' | 'dark' | 'trophy'; label: string }> = {
  published: { variant: 'gold', label: 'Published' },
  draft:     { variant: 'dark',  label: 'Draft' },
  scheduled: { variant: 'terra', label: 'Scheduled' },
  removed:   { variant: 'dark',  label: 'Removed' },
}

export function WorksManager({ works: initialWorks }: WorksManagerProps) {
  const [works, setWorks] = useState<Work[]>(initialWorks)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function updateStatus(workId: string, status: WorkStatus) {
    const supabase = createClient()
    await supabase.from('works').update({ status }).eq('id', workId)
    setWorks(prev => prev.map(w => w.id === workId ? { ...w, status } : w))
    router.refresh()
  }

  async function deleteWork(workId: string) {
    const supabase = createClient()
    await supabase.from('works').update({ status: 'removed' }).eq('id', workId)
    setWorks(prev => prev.filter(w => w.id !== workId))
    setConfirmDelete(null)
    router.refresh()
  }

  return (
    <>
      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-black-card border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-syne font-bold text-ivory mb-2">Remove this work?</h3>
            <p className="text-ivory-dim text-sm mb-6">
              It will be hidden from discovery. You can restore it later from your database.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300 border-red-900/40 hover:border-red-800"
                onClick={() => startTransition(() => deleteWork(confirmDelete))}
                disabled={isPending}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-black-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-xs font-mono text-ivory-dim uppercase tracking-wider w-full">Work</th>
                <th className="text-left px-5 py-3.5 text-xs font-mono text-ivory-dim uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-mono text-ivory-dim uppercase tracking-wider">Views</th>
                <th className="text-right px-5 py-3.5 text-xs font-mono text-ivory-dim uppercase tracking-wider">Hearts</th>
                <th className="px-5 py-3.5 text-xs font-mono text-ivory-dim uppercase tracking-wider whitespace-nowrap">Uploaded</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {works.map((work, i) => {
                const thumb = work.video_thumbnail || work.cover_art_url
                const statusBadge = STATUS_BADGE[work.status] ?? STATUS_BADGE.draft

                return (
                  <tr
                    key={work.id}
                    className="border-b border-white/5 last:border-0 hover:bg-black-hover/40 transition-colors group"
                  >
                    {/* Work info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div
                          className={cn(
                            'w-10 h-14 rounded flex-shrink-0 overflow-hidden',
                            !thumb && generateCardBg(i)
                          )}
                        >
                          {thumb && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/work/${work.id}`}
                            className="font-syne text-ivory hover:text-gold transition-colors line-clamp-1 block"
                          >
                            {work.title}
                          </Link>
                          <p className="text-xs text-ivory-dim capitalize mt-0.5">
                            {work.category.replace('_', ' ')}
                            {work.is_featured && <span className="ml-2 text-gold">★ Featured</span>}
                            {work.is_trending && <span className="ml-2 text-terra-light">↑ Trending</span>}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </td>

                    {/* Views */}
                    <td className="px-5 py-4 text-right font-mono text-ivory-mid text-xs">
                      {formatCount(work.view_count ?? 0)}
                    </td>

                    {/* Hearts */}
                    <td className="px-5 py-4 text-right font-mono text-terra-light text-xs">
                      {formatCount(work.heart_count ?? 0)}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-ivory-dim whitespace-nowrap">
                      {timeAgo(work.published_at ?? work.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/work/${work.id}`}
                          className="text-xs text-ivory-dim hover:text-ivory px-2 py-1 rounded hover:bg-black-hover transition-colors"
                        >
                          View
                        </Link>

                        {work.status === 'published' && (
                          <button
                            onClick={() => startTransition(() => updateStatus(work.id, 'draft'))}
                            className="text-xs text-ivory-dim hover:text-ivory px-2 py-1 rounded hover:bg-black-hover transition-colors"
                            disabled={isPending}
                          >
                            Unpublish
                          </button>
                        )}

                        {work.status === 'draft' && (
                          <button
                            onClick={() => startTransition(() => updateStatus(work.id, 'published'))}
                            className="text-xs text-gold hover:text-gold-light px-2 py-1 rounded hover:bg-gold/10 transition-colors"
                            disabled={isPending}
                          >
                            Publish
                          </button>
                        )}

                        <button
                          onClick={() => setConfirmDelete(work.id)}
                          className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded hover:bg-red-900/10 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

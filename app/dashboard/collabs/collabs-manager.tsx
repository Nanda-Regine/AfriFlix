'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Collab, CollabApplication, CollabStatus, ApplicationStatus } from '@/types'

type CollabWithApps = Collab & { applications: CollabApplication[] }

interface CollabsManagerProps {
  collabs: CollabWithApps[]
}

const STATUS_BADGE: Record<CollabStatus, { variant: 'gold' | 'terra' | 'dark'; label: string }> = {
  open:   { variant: 'gold',  label: 'Open' },
  closed: { variant: 'dark',  label: 'Closed' },
  filled: { variant: 'terra', label: 'Filled' },
}

const APP_STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending:     'text-ivory-dim',
  shortlisted: 'text-gold',
  accepted:    'text-emerald-400',
  declined:    'text-red-400/70',
}

export function CollabsManager({ collabs: initial }: CollabsManagerProps) {
  const [collabs, setCollabs] = useState<CollabWithApps[]>(initial)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function updateCollabStatus(collabId: string, status: CollabStatus) {
    const supabase = createClient()
    await supabase.from('collabs').update({ status }).eq('id', collabId)
    setCollabs(prev =>
      prev.map(c => c.id === collabId ? { ...c, status } : c)
    )
  }

  async function updateApplicationStatus(appId: string, collabId: string, status: ApplicationStatus) {
    const supabase = createClient()
    await supabase.from('collab_applications').update({ status }).eq('id', appId)
    setCollabs(prev =>
      prev.map(c =>
        c.id === collabId
          ? {
              ...c,
              applications: c.applications.map(a =>
                a.id === appId ? { ...a, status } : a
              ),
            }
          : c
      )
    )
  }

  return (
    <div className="space-y-3">
      {collabs.map(collab => {
        const badge = STATUS_BADGE[collab.status] ?? STATUS_BADGE.open
        const isExpanded = expandedId === collab.id
        const pending = collab.applications.filter(a => a.status === 'pending').length

        return (
          <div
            key={collab.id}
            className="bg-black-card border border-white/5 rounded-2xl overflow-hidden"
          >
            {/* Listing header */}
            <div className="flex items-start gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    href={`/collabs/${collab.id}`}
                    className="font-syne font-semibold text-ivory hover:text-gold transition-colors"
                  >
                    {collab.title}
                  </Link>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <span className="text-xs font-mono text-ivory-dim capitalize">
                    {collab.type}
                  </span>
                </div>
                <p className="text-sm text-ivory-dim line-clamp-1">{collab.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-ivory-dim font-mono">
                    {collab.application_count} application{collab.application_count !== 1 ? 's' : ''}
                  </span>
                  {collab.deadline && (
                    <span className="text-xs text-ivory-dim">
                      Deadline: {new Date(collab.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-xs text-ivory-dim">{timeAgo(collab.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {pending > 0 && (
                  <span className="text-xs font-mono bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                    {pending} new
                  </span>
                )}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : collab.id)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                    isExpanded
                      ? 'border-gold/30 text-gold bg-gold/10'
                      : 'border-white/10 text-ivory-dim hover:text-ivory hover:border-white/20'
                  )}
                >
                  {isExpanded ? 'Hide' : 'Applications'} ({collab.applications.length})
                </button>

                {collab.status === 'open' && (
                  <button
                    onClick={() => startTransition(() => updateCollabStatus(collab.id, 'closed'))}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-ivory-dim hover:text-ivory hover:border-white/20 transition-colors"
                    disabled={isPending}
                  >
                    Close
                  </button>
                )}
                {collab.status === 'closed' && (
                  <button
                    onClick={() => startTransition(() => updateCollabStatus(collab.id, 'open'))}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gold/20 text-gold hover:bg-gold/10 transition-colors"
                    disabled={isPending}
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>

            {/* Applications list */}
            {isExpanded && (
              <div className="border-t border-white/5">
                {collab.applications.length === 0 ? (
                  <p className="text-center text-ivory-dim text-sm py-8">
                    No applications yet — share your listing to attract talent.
                  </p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {collab.applications.map(app => {
                      const applicant = app.applicant as { display_name: string; username: string; categories: string[] } | undefined

                      return (
                        <div key={app.id} className="p-5 flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {applicant && (
                                <Link
                                  href={`/creator/${applicant.username}`}
                                  className="font-syne text-sm text-ivory hover:text-gold transition-colors"
                                >
                                  {applicant.display_name}
                                </Link>
                              )}
                              <span className={cn('text-xs font-mono capitalize', APP_STATUS_COLORS[app.status])}>
                                {app.status}
                              </span>
                              <span className="text-xs text-ivory-dim">{timeAgo(app.created_at)}</span>
                            </div>
                            {app.pitch && (
                              <p className="text-sm text-ivory-mid mt-1 line-clamp-2">{app.pitch}</p>
                            )}
                            {app.portfolio_links && app.portfolio_links.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {app.portfolio_links.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gold hover:text-gold-light transition-colors underline"
                                  >
                                    Portfolio {i + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {app.status === 'pending' && (
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => startTransition(() => updateApplicationStatus(app.id, collab.id, 'shortlisted'))}
                                className="text-xs px-2.5 py-1 rounded border border-gold/30 text-gold hover:bg-gold/10 transition-colors"
                                disabled={isPending}
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => startTransition(() => updateApplicationStatus(app.id, collab.id, 'accepted'))}
                                className="text-xs px-2.5 py-1 rounded bg-gold text-black hover:bg-gold-light transition-colors font-semibold"
                                disabled={isPending}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => startTransition(() => updateApplicationStatus(app.id, collab.id, 'declined'))}
                                className="text-xs px-2.5 py-1 rounded border border-white/10 text-ivory-dim hover:text-red-400 hover:border-red-900/40 transition-colors"
                                disabled={isPending}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {app.status === 'shortlisted' && (
                            <button
                              onClick={() => startTransition(() => updateApplicationStatus(app.id, collab.id, 'accepted'))}
                              className="text-xs px-2.5 py-1 rounded bg-gold text-black hover:bg-gold-light transition-colors font-semibold flex-shrink-0"
                              disabled={isPending}
                            >
                              Accept
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

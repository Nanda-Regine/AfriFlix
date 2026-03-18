'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { timeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type { Collab } from '@/types'

export default function CollabDetailPage() {
  const { id } = useParams() as { id: string }
  const [collab, setCollab] = useState<Collab | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [pitch, setPitch] = useState('')
  const [portfolioLinks, setPortfolioLinks] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, creator } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('collabs')
      .select('*, creator:creators(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setCollab(data as Collab)
        setLoading(false)
      })
  }, [id])

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !creator) return
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('collab_applications').insert({
      collab_id: id,
      applicant_id: creator.id,
      pitch: pitch.trim() || null,
      portfolio_links: portfolioLinks.split('\n').map(l => l.trim()).filter(Boolean),
    })
    if (error) setError(error.message)
    else setSubmitted(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!collab) return (
    <div className="min-h-screen pt-24 text-center py-24">
      <p className="text-ivory-dim">Listing not found or has closed.</p>
    </div>
  )

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link href="/collabs" className="text-ivory-dim hover:text-ivory text-sm mb-6 inline-flex items-center gap-2 transition-colors">
          ← Back to Collab Board
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 mt-4">
          {/* Main */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="gold">{collab.type}</Badge>
              {collab.category && <Badge variant="dark">{collab.category}</Badge>}
              {collab.status === 'open'
                ? <Badge variant="gold">Open</Badge>
                : <Badge variant="dark">Closed</Badge>}
            </div>

            <h1 className="font-syne font-bold text-3xl text-ivory mb-4">{collab.title}</h1>

            <p className="text-ivory-mid leading-relaxed text-base mb-6 whitespace-pre-wrap">{collab.description}</p>

            {collab.skills_needed.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Skills Needed</p>
                <div className="flex flex-wrap gap-2">
                  {collab.skills_needed.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-black-card border border-white/10 text-ivory-mid rounded-lg text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 bg-black-card border border-white/5 rounded-xl p-5 mb-8">
              {collab.location && (
                <div>
                  <p className="text-xs text-ivory-dim mb-1">Location</p>
                  <p className="text-sm text-ivory">📍 {collab.location}</p>
                </div>
              )}
              {collab.compensation_type && (
                <div>
                  <p className="text-xs text-ivory-dim mb-1">Compensation</p>
                  <p className="text-sm text-ivory capitalize">{collab.compensation_type.replace('_', ' ')}</p>
                </div>
              )}
              {collab.budget_range && (
                <div>
                  <p className="text-xs text-ivory-dim mb-1">Budget</p>
                  <p className="text-sm text-ivory">{collab.budget_range}</p>
                </div>
              )}
              {collab.deadline && (
                <div>
                  <p className="text-xs text-ivory-dim mb-1">Deadline</p>
                  <p className="text-sm text-ivory">
                    {new Date(collab.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-ivory-dim mb-1">Applications</p>
                <p className="text-sm text-ivory">{collab.application_count} applied</p>
              </div>
              <div>
                <p className="text-xs text-ivory-dim mb-1">Posted</p>
                <p className="text-sm text-ivory">{timeAgo(collab.created_at)}</p>
              </div>
            </div>

            {/* Apply form */}
            {collab.status === 'open' && (
              <div className="bg-black-card border border-white/10 rounded-xl p-6">
                <h2 className="font-syne font-semibold text-ivory mb-4">Apply to this listing</h2>

                {!user ? (
                  <div className="text-center py-4">
                    <p className="text-ivory-dim mb-4">Sign in to apply</p>
                    <Link href="/login">
                      <Button variant="gold">Sign in</Button>
                    </Link>
                  </div>
                ) : !creator ? (
                  <p className="text-ivory-dim text-sm">You need a creator profile to apply. <Link href="/dashboard" className="text-gold hover:text-gold-light">Set up your profile →</Link></p>
                ) : submitted ? (
                  <div className="text-center py-4">
                    <p className="text-2xl mb-3">✅</p>
                    <p className="font-syne text-ivory">Application sent!</p>
                    <p className="text-ivory-dim text-sm mt-1">The creator will review it and get back to you.</p>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="flex flex-col gap-4">
                    <Textarea
                      label="Your pitch"
                      value={pitch}
                      onChange={e => setPitch(e.target.value)}
                      placeholder="Why are you the right person for this? What would you bring?"
                      rows={4}
                      required
                    />
                    <Textarea
                      label="Portfolio links (one per line, optional)"
                      value={portfolioLinks}
                      onChange={e => setPortfolioLinks(e.target.value)}
                      placeholder="https://your-work.com&#10;https://afriflix.co.za/creator/you"
                      rows={3}
                    />
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <Button type="submit" variant="gold">Submit Application</Button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Sidebar — poster */}
          {collab.creator && (
            <div>
              <div className="bg-black-card border border-white/5 rounded-xl p-5 sticky top-24">
                <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-4">Posted by</p>
                <Link href={`/creator/${collab.creator.username}`} className="flex items-center gap-3 mb-4 group">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-syne font-bold">
                    {collab.creator.display_name[0]}
                  </div>
                  <div>
                    <p className="font-syne font-semibold text-ivory group-hover:text-gold transition-colors">
                      {collab.creator.display_name}
                    </p>
                    <p className="text-xs text-ivory-dim">@{collab.creator.username}</p>
                  </div>
                </Link>
                <Link href={`/creator/${collab.creator.username}`}>
                  <Button variant="outline" className="w-full" size="sm">View Profile</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

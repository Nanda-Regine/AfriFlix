'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Report = {
  id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  work: { id: string; title: string; category: string } | null
}

type Verification = {
  id: string
  method: string
  status: string
  notes: string | null
  social_proof_url: string | null
  submitted_at: string
  creator: {
    id: string
    display_name: string
    username: string
    avatar_url: string | null
    country: string
    categories: string[]
  } | null
}

type Stats = {
  totalCreators: number
  publishedWorks: number
  pendingReports: number
  pendingVerifications: number
  pendingPayouts: number
  totalViews: number
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export function AdminPanel({
  stats,
  reports: initialReports,
  verifications: initialVerifications,
}: {
  stats: Stats
  reports: Report[]
  verifications: Verification[]
}) {
  const [tab, setTab] = useState<'overview' | 'reports' | 'verify'>('overview')
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications)
  const [working, setWorking] = useState<string | null>(null)

  async function updateReport(id: string, status: string, removeWork = false) {
    setWorking(id)
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, remove_work: removeWork }),
    })
    setReports(r => r.filter(x => x.id !== id))
    setWorking(null)
  }

  async function updateVerification(id: string, status: string, admin_notes?: string) {
    setWorking(id)
    await fetch('/api/admin/verify', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, admin_notes }),
    })
    setVerifications(v => v.filter(x => x.id !== id))
    setWorking(null)
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: `Reports (${reports.length})` },
    { id: 'verify', label: `Verify (${verifications.length})` },
  ] as const

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-1">Control Panel</p>
        <h1 className="font-syne font-bold text-3xl text-ivory">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-syne transition-colors ${
              tab === t.id
                ? 'bg-gold text-black font-semibold'
                : 'bg-black-card text-ivory-dim hover:text-ivory border border-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Creators', value: formatNum(stats.totalCreators), color: 'text-gold' },
              { label: 'Published Works', value: formatNum(stats.publishedWorks), color: 'text-gold' },
              { label: 'Total Views', value: formatNum(stats.totalViews), color: 'text-gold' },
              { label: 'Pending Reports', value: String(stats.pendingReports), color: stats.pendingReports > 0 ? 'text-red-400' : 'text-ivory' },
              { label: 'Pending Verifications', value: String(stats.pendingVerifications), color: stats.pendingVerifications > 0 ? 'text-terra-light' : 'text-ivory' },
              { label: 'Pending Payouts', value: String(stats.pendingPayouts), color: 'text-ivory' },
            ].map(stat => (
              <div key={stat.label} className="bg-black-card border border-white/5 rounded-xl p-5">
                <p className={`font-syne font-bold text-3xl ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-ivory-dim mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="bg-black-card border border-white/5 rounded-xl p-5">
            <p className="font-syne font-semibold text-ivory mb-4">Quick Actions</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setTab('reports')}>
                Review Reports ({stats.pendingReports})
              </Button>
              <Button variant="outline" onClick={() => setTab('verify')}>
                Verify Creators ({stats.pendingVerifications})
              </Button>
              <a href="/dashboard/analytics" className="inline-block">
                <Button variant="ghost">Platform Analytics</Button>
              </a>
            </div>
          </div>

          {/* Danger zone notice */}
          <div className="border border-red-500/20 rounded-xl p-5 bg-red-500/5">
            <p className="font-syne font-semibold text-red-400 mb-2">Admin Access</p>
            <p className="text-xs text-ivory-dim">
              You have elevated platform access. All moderation actions are logged. Content removal is irreversible — use only after reviewing the full report context.
            </p>
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-black-card border border-white/5 rounded-xl p-10 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-ivory font-syne font-semibold">No pending reports</p>
              <p className="text-ivory-dim text-sm mt-1">The platform is clean. Great work.</p>
            </div>
          ) : (
            reports.map(report => (
              <div key={report.id} className="bg-black-card border border-white/5 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-ivory font-medium">
                      {report.work?.title ?? 'Unknown work'}
                      <Badge variant="outline" className="ml-2 text-xs">{report.work?.category}</Badge>
                    </p>
                    <p className="text-xs text-ivory-dim mt-0.5">{timeAgo(report.created_at)}</p>
                  </div>
                  <Badge variant="terra">{report.reason}</Badge>
                </div>
                {report.details && (
                  <p className="text-sm text-ivory-dim mb-4 bg-black/30 rounded-lg p-3 italic">
                    &ldquo;{report.details}&rdquo;
                  </p>
                )}
                {report.work && (
                  <p className="text-xs text-ivory-dim mb-4">
                    <a href={`/work/${report.work.id}`} target="_blank" rel="noopener noreferrer"
                       className="text-gold hover:underline">
                      View content →
                    </a>
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateReport(report.id, 'dismissed')}
                    disabled={working === report.id}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateReport(report.id, 'reviewed')}
                    disabled={working === report.id}
                  >
                    Mark Reviewed
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => updateReport(report.id, 'actioned', true)}
                    disabled={working === report.id}
                    className="bg-red-500 hover:bg-red-400 text-white"
                  >
                    Remove Content
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── VERIFICATIONS ── */}
      {tab === 'verify' && (
        <div className="space-y-4">
          {verifications.length === 0 ? (
            <div className="bg-black-card border border-white/5 rounded-xl p-10 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-ivory font-syne font-semibold">No pending verifications</p>
              <p className="text-ivory-dim text-sm mt-1">All verification requests have been processed.</p>
            </div>
          ) : (
            verifications.map(v => (
              <div key={v.id} className="bg-black-card border border-white/5 rounded-xl p-5">
                <div className="flex items-start gap-4 mb-4">
                  {v.creator?.avatar_url ? (
                    <img src={v.creator.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                      {v.creator?.display_name?.[0] ?? '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-ivory font-syne font-semibold">
                      {v.creator?.display_name ?? 'Unknown'}
                      <span className="text-ivory-dim font-normal ml-2">@{v.creator?.username}</span>
                    </p>
                    <p className="text-xs text-ivory-dim mt-0.5">
                      {v.creator?.country} &middot; {v.creator?.categories?.join(', ')}
                    </p>
                    <p className="text-xs text-ivory-dim mt-0.5">Submitted {timeAgo(v.submitted_at)}</p>
                  </div>
                  <Badge variant="gold">
                    {v.method === 'id_document' ? 'ID Doc' : v.method === 'social_link' ? 'Social' : 'Voucher'}
                  </Badge>
                </div>

                {v.notes && (
                  <p className="text-sm text-ivory-dim mb-3 bg-black/30 rounded-lg p-3 italic">
                    &ldquo;{v.notes}&rdquo;
                  </p>
                )}

                {v.social_proof_url && (
                  <p className="text-xs mb-3">
                    <a href={v.social_proof_url} target="_blank" rel="noopener noreferrer"
                       className="text-gold hover:underline">
                      View social proof →
                    </a>
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateVerification(v.id, 'rejected')}
                    disabled={working === v.id}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => updateVerification(v.id, 'approved')}
                    disabled={working === v.id}
                  >
                    Approve & Verify
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

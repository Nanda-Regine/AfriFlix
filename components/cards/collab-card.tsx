import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/utils'
import type { Collab } from '@/types'

const TYPE_COLORS: Record<string, 'gold' | 'terra' | 'dark'> = {
  collab: 'gold',
  commission: 'terra',
  casting: 'gold',
  gig: 'terra',
  mentorship: 'dark',
}

interface CollabCardProps {
  collab: Collab
}

export function CollabCard({ collab }: CollabCardProps) {
  return (
    <Link
      href={`/collabs/${collab.id}`}
      className="block p-5 bg-black-card border border-white/5 rounded-xl hover:border-gold/20 hover:bg-black-hover transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={TYPE_COLORS[collab.type] ?? 'dark'}>
            {collab.type}
          </Badge>
          {collab.category && <Badge variant="dark">{collab.category}</Badge>}
        </div>
        {collab.compensation_type && (
          <span className="text-xs font-mono text-ivory-dim flex-shrink-0">
            {collab.compensation_type === 'paid' ? '💰 Paid' :
             collab.compensation_type === 'revenue_share' ? '📊 Rev share' : '🤝 Credit'}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-syne font-semibold text-ivory mb-2 line-clamp-2 group-hover:text-gold">
        {collab.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-ivory-dim leading-relaxed line-clamp-2 mb-4">
        {collab.description}
      </p>

      {/* Skills */}
      {collab.skills_needed.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {collab.skills_needed.slice(0, 4).map(skill => (
            <span key={skill} className="text-xs px-2 py-1 bg-black rounded border border-white/10 text-ivory-dim">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-ivory-dim">
        <div className="flex items-center gap-3">
          {collab.location && <span>📍 {collab.location}</span>}
          {collab.deadline && (
            <span>⏰ {new Date(collab.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{collab.application_count} applied</span>
          <span>{timeAgo(collab.created_at)}</span>
        </div>
      </div>

      {/* Creator */}
      {collab.creator && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs font-syne text-gold">
            {collab.creator.display_name[0]}
          </div>
          <span className="text-xs text-ivory-dim">{collab.creator.display_name}</span>
        </div>
      )}
    </Link>
  )
}

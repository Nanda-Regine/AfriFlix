import Link from 'next/link'
import Image from 'next/image'
import { formatCount } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Creator } from '@/types'

interface CreatorCardProps {
  creator: Creator
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Link
      href={`/creator/${creator.username}`}
      className="group flex flex-col items-center gap-3 p-5 bg-black-card border border-white/5 rounded-xl hover:border-gold/20 hover:bg-black-hover transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {/* Avatar */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gold/20 to-terra/20 border-2 border-white/10 group-hover:border-gold/30 transition-colors">
        {creator.avatar_url ? (
          <Image src={creator.avatar_url} alt={creator.display_name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-syne font-bold text-2xl text-gold">
            {creator.display_name[0].toUpperCase()}
          </div>
        )}
        {creator.is_rising && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-terra rounded-full border-2 border-black-card flex items-center justify-center text-[10px]">
            ↑
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <div className="flex items-center gap-1.5 justify-center">
          <p className="font-syne font-semibold text-ivory text-sm group-hover:text-gold transition-colors">
            {creator.display_name}
          </p>
          {creator.african_verified && (
            <span className="text-gold text-xs" title="Verified African creator">✓</span>
          )}
        </div>
        <p className="text-xs text-ivory-dim mt-0.5">@{creator.username}</p>
      </div>

      {/* Categories */}
      {creator.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {creator.categories.slice(0, 2).map(cat => (
            <Badge key={cat} variant="dark" className="text-[10px]">{cat}</Badge>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-center">
        <div>
          <p className="text-sm font-mono font-semibold text-ivory">{formatCount(creator.works_count)}</p>
          <p className="text-[10px] text-ivory-dim uppercase tracking-wider">Works</p>
        </div>
        <div>
          <p className="text-sm font-mono font-semibold text-ivory">{formatCount(creator.follower_count)}</p>
          <p className="text-[10px] text-ivory-dim uppercase tracking-wider">Followers</p>
        </div>
      </div>
    </Link>
  )
}

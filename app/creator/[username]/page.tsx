import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkCard } from '@/components/cards/work-card'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from '@/components/community/follow-button'
import { CreativeDnaCard } from '@/components/ai/creative-dna-card'
import { TipButton } from '@/components/payments/tip-button'
import { formatCount } from '@/lib/utils'
import { CATEGORY_META } from '@/types'
import type { Creator, Work, ContentCategory } from '@/types'

type CreatorWithBadges = Creator & { badges: { badge_type: string; awarded_at: string }[] }

async function getCreator(username: string): Promise<CreatorWithBadges | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('creators')
    .select('*, badges:badges(badge_type, awarded_at)')
    .eq('username', username)
    .single()
  return data as CreatorWithBadges | null
}

async function getViewerCreatorId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
  return data?.id ?? null
}

async function getCreatorWorks(creatorId: string): Promise<Record<ContentCategory, Work[]>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const works = (data as Work[]) ?? []
  return works.reduce((acc, work) => {
    if (!acc[work.category]) acc[work.category] = []
    acc[work.category].push(work)
    return acc
  }, {} as Record<ContentCategory, Work[]>)
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const creator = await getCreator(username)
  if (!creator) return {}
  const desc = creator.bio ?? `${creator.categories.map(c => c.replace('_', ' ')).join(', ')} creator from ${creator.country} on AfriFlix`
  return {
    title: `${creator.display_name} (@${creator.username})`,
    description: desc,
    keywords: [...creator.categories, creator.country, ...creator.cultural_roots, 'African creator', 'AfriFlix'],
    openGraph: {
      type: 'profile',
      title: `${creator.display_name} on AfriFlix`,
      description: desc,
      images: creator.avatar_url ? [{ url: creator.avatar_url, width: 400, height: 400, alt: creator.display_name }] : [],
      siteName: 'AfriFlix',
    },
    twitter: {
      card: 'summary',
      title: `${creator.display_name} (@${creator.username})`,
      description: desc,
      images: creator.avatar_url ? [creator.avatar_url] : [],
    },
  }
}

export default async function CreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const [creator, viewerCreatorId] = await Promise.all([
    getCreator(username),
    getViewerCreatorId(),
  ])
  if (!creator) notFound()

  const isOwner = viewerCreatorId === creator.id

  const worksByCategory = await getCreatorWorks(creator.id)
  const categories = Object.keys(worksByCategory) as ContentCategory[]

  // Parse Creative DNA if stored
  let creativeDna = null
  if (creator.creative_dna) {
    try { creativeDna = JSON.parse(creator.creative_dna) } catch { /* noop */ }
  }

  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creator.display_name,
    url: `${BASE}/creator/${creator.username}`,
    image: creator.avatar_url ?? undefined,
    description: creator.bio ?? undefined,
    nationality: creator.country,
    sameAs: [],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-gold/20 to-terra/20 kente-bg">
        {creator.banner_url && (
          <Image src={creator.banner_url} alt="Banner" fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Profile header */}
        <div className="relative -mt-16 mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-black-card border-4 border-black flex-shrink-0 shadow-card">
            {creator.avatar_url ? (
              <Image src={creator.avatar_url} alt={creator.display_name} width={112} height={112} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-syne font-bold text-4xl text-gold bg-gold/10">
                {creator.display_name[0]}
              </div>
            )}
          </div>

          <div className="flex-1 pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-syne font-bold text-2xl text-ivory">{creator.display_name}</h1>
              {creator.african_verified && (
                <Badge variant="gold">✓ Verified</Badge>
              )}
              {creator.is_rising && (
                <Badge variant="terra">Rising</Badge>
              )}
              {creator.plan === 'creator_pro' && (
                <Badge variant="gold">Pro</Badge>
              )}
            </div>
            <p className="text-ivory-dim text-sm">@{creator.username} · {creator.country}</p>
          </div>

          {/* Actions */}
          {!isOwner && (
            <div className="flex gap-3">
              <FollowButton creatorId={creator.id} />
              {creator.tips_enabled && (
                <TipButton creator={creator} />
              )}
            </div>
          )}
          {isOwner && (
            <Link href="/dashboard/profile/setup" className="px-4 py-2 border border-white/10 rounded-pill text-sm text-ivory-mid hover:text-ivory hover:border-white/20 transition-colors font-syne">
              Edit profile
            </Link>
          )}
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-ivory-mid max-w-2xl leading-relaxed mb-6">{creator.bio}</p>
        )}

        {/* Categories */}
        {creator.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {creator.categories.map(cat => (
              <Badge key={cat} variant="dark">{CATEGORY_META[cat]?.label ?? cat}</Badge>
            ))}
            {creator.cultural_roots.map(root => (
              <Badge key={root} variant="dark">{root}</Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-8 pb-8 mb-8 border-b border-white/10">
          {[
            { label: 'Works', value: creator.works_count },
            { label: 'Followers', value: creator.follower_count },
            { label: 'Views', value: creator.total_views },
            { label: 'Hearts', value: creator.total_hearts },
          ].map(stat => (
            <div key={stat.label}>
              <p className="font-syne font-bold text-2xl text-ivory">{formatCount(stat.value)}</p>
              <p className="text-xs text-ivory-dim">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Promo reel */}
        {creator.promo_reel_url && (
          <div className="mb-8">
            <video
              src={creator.promo_reel_url}
              className="w-full max-w-2xl rounded-2xl"
              controls
              poster={creator.banner_url ?? undefined}
            />
          </div>
        )}

        {/* Badges */}
        {(creator.badges?.length ?? 0) > 0 && (
          <div className="mb-8">
            <BadgeRack badges={creator.badges ?? []} />
          </div>
        )}

        {/* Creative DNA */}
        <div className="mb-8 max-w-xl">
          <CreativeDnaCard
            dna={creativeDna}
            creatorId={creator.id}
            isOwner={isOwner}
            worksCount={creator.works_count}
          />
        </div>

        {/* Works by category */}
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ivory-dim">No published works yet.</p>
          </div>
        ) : (
          <div className="space-y-12 pb-16">
            {categories.map(cat => (
              <div key={cat}>
                <h2 className="font-syne font-semibold text-lg text-ivory mb-4">
                  {CATEGORY_META[cat]?.label ?? cat}
                  <span className="text-ivory-dim text-sm font-normal ml-2">({worksByCategory[cat].length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {worksByCategory[cat].map((work, i) => (
                    <WorkCard key={work.id} work={work} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}

const BADGE_META: Record<string, { label: string; icon: string; color: string }> = {
  founding_creator:  { label: 'Founding Creator', icon: '🌍', color: 'border-gold/40 text-gold bg-gold/10' },
  first_work:        { label: 'First Work', icon: '✨', color: 'border-white/10 text-ivory-mid bg-white/5' },
  hearts_100:        { label: '100 Hearts', icon: '❤️', color: 'border-terra/30 text-terra-light bg-terra/10' },
  hearts_1000:       { label: '1K Hearts', icon: '❤️‍🔥', color: 'border-terra/40 text-terra-light bg-terra/15' },
  hearts_10000:      { label: '10K Hearts', icon: '💝', color: 'border-terra/50 text-terra-light bg-terra/20' },
  followers_100:     { label: '100 Followers', icon: '👥', color: 'border-sky-500/30 text-sky-400 bg-sky-500/10' },
  followers_1000:    { label: '1K Followers', icon: '🌟', color: 'border-sky-500/40 text-sky-400 bg-sky-500/15' },
  followers_10000:   { label: '10K Followers', icon: '🚀', color: 'border-sky-500/50 text-sky-400 bg-sky-500/20' },
  views_1000:        { label: '1K Views', icon: '👁️', color: 'border-white/10 text-ivory-mid bg-white/5' },
  views_10000:       { label: '10K Views', icon: '🔥', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
  views_100000:      { label: '100K Views', icon: '💫', color: 'border-amber-500/50 text-amber-400 bg-amber-500/20' },
  works_10:          { label: '10 Works', icon: '🎬', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
  works_50:          { label: '50 Works', icon: '🏛️', color: 'border-purple-500/50 text-purple-400 bg-purple-500/20' },
  verified_african:  { label: 'African Verified', icon: '✓', color: 'border-gold/50 text-gold bg-gold/15' },
  tipjar_unlocked:   { label: 'Tip Jar Open', icon: '💰', color: 'border-green-500/30 text-green-400 bg-green-500/10' },
  collab_completed:  { label: 'Collaborator', icon: '🤝', color: 'border-white/10 text-ivory-mid bg-white/5' },
}

function BadgeRack({ badges }: { badges: { badge_type: string }[] }) {
  return (
    <div>
      <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider mb-3">Milestones</p>
      <div className="flex flex-wrap gap-2">
        {badges.map(b => {
          const meta = BADGE_META[b.badge_type]
          if (!meta) return null
          return (
            <div
              key={b.badge_type}
              title={meta.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-syne font-medium ${meta.color}`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


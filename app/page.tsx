import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BrowseRow } from '@/components/cards/browse-row'
import { CreatorCard } from '@/components/cards/creator-card'
import { MoodRecommender } from '@/components/ai/mood-recommender'
import { Button } from '@/components/ui/button'
import { WorkCardSkeleton, CreatorCardSkeleton } from '@/components/ui/shimmer'
import type { Work, Creator } from '@/types'

// Seed works for MVP (carry from Phase 1)
const SEED_WORKS: Partial<Work>[] = [
  { id: '1', title: 'The Weight of Ubuntu', category: 'film', view_count: 12400, heart_count: 890, is_trending: true },
  { id: '2', title: 'Daughters of Soweto', category: 'film', view_count: 9800, heart_count: 720 },
  { id: '3', title: 'Lagos After Dark', category: 'film', view_count: 18200, heart_count: 1340, is_trending: true },
  { id: '4', title: 'Desert Bloom', category: 'film', view_count: 7300, heart_count: 540 },
  { id: '5', title: 'The Kente Weaver\'s Son', category: 'film', view_count: 6100, heart_count: 440 },
  { id: '6', title: 'Nairobi Nights', category: 'film', view_count: 11500, heart_count: 870 },
  { id: '7', title: 'Roots of Red Clay', category: 'film', view_count: 22000, heart_count: 1800, is_featured: true },
  { id: '8', title: 'When the Baobab Fell', category: 'film', view_count: 19600, heart_count: 1560, is_featured: true },
  { id: '9', title: 'Letters from Accra', category: 'film', view_count: 14200, heart_count: 980 },
  { id: '10', title: 'The Griots Remember', category: 'film', view_count: 16800, heart_count: 1230 },
  { id: '11', title: 'Zanele', category: 'film', view_count: 24000, heart_count: 2100, is_featured: true },
  { id: '12', title: 'Maputo Morning', category: 'film', view_count: 8900, heart_count: 670 },
  { id: '13', title: 'Voices of the Cape', category: 'poetry', view_count: 5400, heart_count: 620 },
  { id: '14', title: 'Harare Haiku', category: 'poetry', view_count: 3200, heart_count: 410 },
  { id: '15', title: 'The Last Griot Standing', category: 'poetry', view_count: 7800, heart_count: 890, is_featured: true },
  { id: '16', title: 'Blood and Bougainvillea', category: 'poetry', view_count: 4600, heart_count: 560 },
  { id: '17', title: 'She Spoke Mountains', category: 'poetry', view_count: 6100, heart_count: 730 },
]

async function getTrendingWorks(): Promise<Work[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('works')
      .select('*, creator:creators(display_name, username, avatar_url)')
      .eq('status', 'published')
      .eq('is_trending', true)
      .order('view_count', { ascending: false })
      .limit(8)
    return (data as Work[]) ?? []
  } catch {
    return SEED_WORKS.slice(0, 6) as Work[]
  }
}

async function getAwardWinners(): Promise<Work[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('works')
      .select('*, creator:creators(display_name, username, avatar_url)')
      .eq('status', 'published')
      .eq('is_featured', true)
      .eq('category', 'film')
      .order('heart_count', { ascending: false })
      .limit(6)
    return (data as Work[]) ?? []
  } catch {
    return SEED_WORKS.slice(6, 12) as Work[]
  }
}

async function getPoetryWorks(): Promise<Work[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('works')
      .select('*, creator:creators(display_name, username, avatar_url)')
      .eq('status', 'published')
      .eq('category', 'poetry')
      .order('heart_count', { ascending: false })
      .limit(6)
    return (data as Work[]) ?? []
  } catch {
    return SEED_WORKS.slice(12) as Work[]
  }
}

async function getFeaturedCreators(): Promise<Creator[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('creators')
      .select('*')
      .eq('is_featured', true)
      .order('follower_count', { ascending: false })
      .limit(6)
    return (data as Creator[]) ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [trending, awardWinners, poetry, featuredCreators] = await Promise.all([
    getTrendingWorks(),
    getAwardWinners(),
    getPoetryWorks(),
    getFeaturedCreators(),
  ])

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Kente background */}
        <div className="absolute inset-0 kente-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
          {/* Label */}
          <p className="section-label mb-5 animate-fade-up">
            54 African Nations · All Creative Forms
          </p>

          {/* Headline */}
          <h1 className="font-syne font-extrabold text-5xl sm:text-6xl lg:text-7xl text-ivory leading-[1.05] mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            The World Is Finally{' '}
            <span className="text-gold">Ready</span>{' '}
            for Our Stories.
          </h1>

          <p className="text-ivory-mid text-lg sm:text-xl max-w-2xl leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            African film, music, dance, poetry, writing, comedy, theatre and art — all in one home. Built for creators. Built for us.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-16 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Link href="/explore">
              <Button variant="gold" size="lg">Start Watching</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg">For Creators</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 animate-fade-up" style={{ animationDelay: '400ms' }}>
            {[
              { label: 'African Nations', value: '54' },
              { label: 'Stories', value: '2,400+' },
              { label: 'Creative Genres', value: '12+' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="font-syne font-bold text-3xl text-gold">{stat.value}</p>
                <p className="text-sm text-ivory-dim">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSE ROWS */}
      <div className="py-8">
        <BrowseRow
          title="Trending in Africa"
          works={trending}
          badge={(_, i) => i === 0 ? { text: 'Hot', variant: 'terra' } : i < 3 ? { text: 'New', variant: 'gold' } : undefined}
        />

        <BrowseRow
          title="Award-Winning African Cinema"
          works={awardWinners}
          badge={() => ({ text: '🏆', variant: 'trophy' })}
        />

        <BrowseRow
          title="Spoken Word & Poetry"
          works={poetry}
          badge={(w) => w.is_featured ? { text: 'Exclusive', variant: 'gold' } : undefined}
        />
      </div>

      {/* MOOD RECOMMENDER */}
      <MoodRecommender />

      {/* FEATURED CREATORS */}
      {featuredCreators.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <p className="section-label mb-2">Spotlight</p>
              <h2 className="section-heading">Featured Creators</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredCreators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/explore">
                <Button variant="outline">Discover All Creators</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES GRID */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="section-label mb-2">The Universe</p>
          <h2 className="section-heading mb-8">8 Creative Worlds</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Film & Series', emoji: '🎬', href: '/category/film', desc: 'Short films, web series, docs' },
              { label: 'Music', emoji: '🎵', href: '/category/music', desc: 'Amapiano, afrobeats & beyond' },
              { label: 'Dance', emoji: '💃', href: '/category/dance', desc: 'Choreography & cultural dance' },
              { label: 'Writing', emoji: '✍️', href: '/category/writing', desc: 'Stories, novels, essays' },
              { label: 'Poetry', emoji: '🎤', href: '/category/poetry', desc: 'Spoken word & slam' },
              { label: 'Comedy', emoji: '😂', href: '/category/comedy', desc: 'Stand-up, sketches & satire' },
              { label: 'Theatre', emoji: '🎭', href: '/category/theatre', desc: 'Stage & spoken arts' },
              { label: 'Visual Art', emoji: '🎨', href: '/category/visual-art', desc: 'Galleries & art process' },
            ].map(cat => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group p-5 bg-black-card border border-white/5 rounded-xl hover:border-gold/20 hover:bg-black-hover transition-all duration-200"
              >
                <div className="text-3xl mb-3">{cat.emoji}</div>
                <p className="font-syne font-semibold text-ivory text-sm group-hover:text-gold transition-colors">{cat.label}</p>
                <p className="text-xs text-ivory-dim mt-1">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CREATOR WAITLIST */}
      <section id="creators" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black-card border border-gold/20 rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 kente-bg opacity-30" />
            <div className="relative z-10">
              <p className="section-label mb-4">Creator Programme</p>
              <h2 className="font-syne font-bold text-3xl sm:text-4xl text-ivory mb-4">
                Are You an African Creator?
              </h2>
              <p className="text-ivory-dim text-lg mb-8 max-w-xl mx-auto">
                Upload your films, music, poetry and more. Reach a global audience. Earn from your work. Join the founding creator programme.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-10">
                {[
                  'Upload films & performances',
                  'Earn from your content',
                  'Reach the African diaspora',
                  'Founding creator badge',
                ].map(benefit => (
                  <span key={benefit} className="flex items-center gap-2 text-sm text-ivory-mid">
                    <span className="text-gold">✓</span> {benefit}
                  </span>
                ))}
              </div>
              <Link href="/signup">
                <Button variant="gold" size="lg">Join the Movement</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

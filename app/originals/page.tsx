import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BrowseRow } from '@/components/cards/browse-row'
import { formatCount } from '@/lib/utils'
import type { Work, Creator } from '@/types'

export const metadata: Metadata = {
  title: 'AfriFlix Originals — Curated African Excellence',
  description: 'Handpicked by our editorial team — the finest African films, music, poetry, and art on the platform.',
  openGraph: { title: 'AfriFlix Originals', description: 'The finest African creative works, curated by our team.' },
}

export const revalidate = 3600

// Editorial picks — featured=true ordered by hearts, limited to best per category
const getEditorialHero = unstable_cache(async (): Promise<Work | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url, country, african_verified)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('heart_count', { ascending: false })
    .limit(1)
    .single()
  return (data as Work) ?? null
}, ['originals-hero'], { revalidate: 3600 })

const getOriginalsFilm = unstable_cache(async (): Promise<Work[]> => {
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
}, ['originals-film'], { revalidate: 3600 })

const getOriginalsMusic = unstable_cache(async (): Promise<Work[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .eq('category', 'music')
    .order('view_count', { ascending: false })
    .limit(6)
  return (data as Work[]) ?? []
}, ['originals-music'], { revalidate: 3600 })

const getOriginalsPoetry = unstable_cache(async (): Promise<Work[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .in('category', ['poetry', 'writing'])
    .order('heart_count', { ascending: false })
    .limit(6)
  return (data as Work[]) ?? []
}, ['originals-poetry'], { revalidate: 3600 })

const getSpotlightCreators = unstable_cache(async (): Promise<Creator[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('creators')
    .select('*')
    .eq('is_featured', true)
    .eq('african_verified', true)
    .order('total_hearts', { ascending: false })
    .limit(4)
  return (data as Creator[]) ?? []
}, ['originals-creators'], { revalidate: 3600 })

// Seed fallback works for MVP (before real data)
const SEED_HERO = {
  id: '7',
  title: 'Roots of Red Clay',
  category: 'film',
  description: 'A sweeping cinematic journey through the red clay hills of the Eastern Cape, where memory, land, and identity intertwine across three generations of a Xhosa family.',
  video_thumbnail: null,
  cover_art_url: null,
  view_count: 22000,
  heart_count: 1800,
  is_featured: true,
  creator: { display_name: 'Zola Ndaba', username: 'zolandaba', avatar_url: null, country: 'South Africa', african_verified: true },
} as unknown as Work

export default async function OriginalsPage() {
  const [hero, films, music, poetry, spotlights] = await Promise.all([
    getEditorialHero(),
    getOriginalsFilm(),
    getOriginalsMusic(),
    getOriginalsPoetry(),
    getSpotlightCreators(),
  ])

  const featuredWork = hero ?? SEED_HERO
  const cr = Array.isArray(featuredWork.creator) ? featuredWork.creator[0] : featuredWork.creator as {
    display_name?: string; username?: string; country?: string; african_verified?: boolean
  } | null

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[75vh] flex items-end overflow-hidden">
        {/* Backdrop */}
        {featuredWork.video_thumbnail || featuredWork.cover_art_url ? (
          <Image
            src={(featuredWork.video_thumbnail ?? featuredWork.cover_art_url)!}
            alt={featuredWork.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 kente-bg opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

        {/* Editorial badge */}
        <div className="absolute top-8 left-4 sm:left-8">
          <div className="inline-flex items-center gap-2 bg-gold px-3 py-1.5 rounded-full">
            <span className="text-black text-xs font-syne font-bold uppercase tracking-widest">AfriFlix Originals</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 pb-16 pt-32">
          <p className="text-gold text-xs font-mono uppercase tracking-widest mb-3">
            Editor&apos;s Pick &middot; {featuredWork.category}
          </p>
          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl text-ivory leading-tight mb-4 max-w-3xl">
            {featuredWork.title}
          </h1>
          {featuredWork.description && (
            <p className="text-ivory-mid text-lg max-w-2xl leading-relaxed mb-6">
              {featuredWork.description.slice(0, 200)}{featuredWork.description.length > 200 ? '…' : ''}
            </p>
          )}
          <div className="flex items-center gap-4 mb-8">
            {cr && (
              <p className="text-ivory-dim text-sm">
                by <span className="text-ivory font-medium">{cr.display_name}</span>
                {cr.country && <span className="text-ivory-dim"> · {cr.country}</span>}
                {cr.african_verified && (
                  <Badge variant="gold" className="ml-2 text-xs">Verified African</Badge>
                )}
              </p>
            )}
            <span className="text-ivory-dim text-sm">
              {formatCount(featuredWork.heart_count ?? 0)} hearts
            </span>
          </div>
          <div className="flex gap-3">
            <Link href={`/work/${featuredWork.id}`}>
              <Button variant="gold" size="lg">Watch Now</Button>
            </Link>
            {cr?.username && (
              <Link href={`/creator/${cr.username}`}>
                <Button variant="outline" size="lg">Creator Profile</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── EDITORIAL STATEMENT ──────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-mono text-gold uppercase tracking-widest mb-4">Our Curation Philosophy</p>
          <p className="font-syne text-2xl sm:text-3xl text-ivory leading-relaxed">
            "We seek work that is unmistakably African — rooted in place, honest in voice,
            and brave in form. These are the stories the world has been waiting for."
          </p>
          <p className="text-ivory-dim text-sm mt-4">— The AfriFlix Editorial Team</p>
        </div>
      </section>

      {/* ── CURATED ROWS ─────────────────────────────────────────────────── */}
      <div className="pb-8">
        {films.length > 0 && (
          <BrowseRow
            title="Essential African Cinema"
            works={films}
            badge={() => ({ text: 'Original Pick', variant: 'gold' })}
          />
        )}

        {music.length > 0 && (
          <BrowseRow
            title="Sounds of the Continent"
            works={music}
            badge={() => ({ text: 'Featured', variant: 'gold' })}
          />
        )}

        {poetry.length > 0 && (
          <BrowseRow
            title="Words That Move"
            works={poetry}
            badge={(w) => w.category === 'poetry' ? { text: 'Spoken Word', variant: 'terra' } : { text: 'Writing', variant: 'gold' }}
          />
        )}
      </div>

      {/* ── CREATOR SPOTLIGHTS ───────────────────────────────────────────── */}
      {spotlights.length > 0 && (
        <section className="py-16 px-4 sm:px-6 bg-black-mid">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-mono text-gold uppercase tracking-widest mb-2">Creator Spotlight</p>
            <h2 className="font-syne font-bold text-3xl text-ivory mb-8">Voices We Champion</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {spotlights.map(creator => (
                <Link
                  key={creator.id}
                  href={`/creator/${creator.username}`}
                  className="group bg-black-card border border-white/5 rounded-2xl p-6 hover:border-gold/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {creator.avatar_url ? (
                      <Image
                        src={creator.avatar_url}
                        alt={creator.display_name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-lg">
                        {creator.display_name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-syne font-semibold text-ivory group-hover:text-gold transition-colors text-sm">
                        {creator.display_name}
                      </p>
                      <p className="text-xs text-ivory-dim">{creator.country}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(creator.categories ?? []).slice(0, 2).map((cat: string) => (
                      <Badge key={cat} variant="outline" className="text-xs capitalize">{cat}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-ivory-dim">
                    <span>{formatCount(creator.follower_count ?? 0)} followers</span>
                    <span>{formatCount(creator.total_hearts ?? 0)} hearts</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── THE CRITERIA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-gold uppercase tracking-widest mb-2">How Works Get Featured</p>
          <h2 className="font-syne font-bold text-3xl text-ivory mb-10">What We Look For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: '🌍',
                title: 'African Authenticity',
                desc: 'Work rooted in African experience, perspective, or cultural tradition — not just set in Africa.',
              },
              {
                icon: '🎨',
                title: 'Creative Excellence',
                desc: 'Craft that is intentional, innovative, or deeply personal. We are drawn to distinctive voices, not trends.',
              },
              {
                icon: '💫',
                title: 'Cultural Impact',
                desc: 'Stories that shift how people see Africa — from within and from the diaspora — challenging stereotypes and expanding imagination.',
              },
            ].map(item => (
              <div key={item.title} className="bg-black-card border border-white/5 rounded-2xl p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <p className="font-syne font-semibold text-ivory mb-2">{item.title}</p>
                <p className="text-sm text-ivory-dim leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBMIT FOR CURATION ──────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-black-mid">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-mono text-gold uppercase tracking-widest mb-3">Submit for Curation</p>
          <h2 className="font-syne font-bold text-3xl text-ivory mb-4">
            Think Your Work Belongs Here?
          </h2>
          <p className="text-ivory-dim text-lg mb-8 max-w-xl mx-auto">
            If you have published at least 3 works on AfriFlix and believe your content meets our editorial standard, our team reviews all creator submissions.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/signup">
              <Button variant="gold" size="lg">Upload Your Work</Button>
            </Link>
            <a href="mailto:editorial@afriflix.co.za">
              <Button variant="outline" size="lg">Contact Editorial</Button>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

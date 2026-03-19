import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkCard } from '@/components/cards/work-card'
import { CreatorCard } from '@/components/cards/creator-card'
import { AFRICAN_COUNTRIES } from '@/types'
import type { Work, Creator } from '@/types'

async function getCountryContent(country: string) {
  const supabase = await createClient()

  const [worksResult, creatorsResult] = await Promise.all([
    supabase
      .from('works')
      .select('*, creator:creators(display_name, username, avatar_url)')
      .eq('status', 'published')
      .eq('country_of_origin', country)
      .order('view_count', { ascending: false })
      .limit(24),
    supabase
      .from('creators')
      .select('*')
      .eq('country', country)
      .order('follower_count', { ascending: false })
      .limit(12),
  ])

  return {
    works: (worksResult.data as Work[]) ?? [],
    creators: (creatorsResult.data as Creator[]) ?? [],
  }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const countryName = AFRICAN_COUNTRIES.find(c => c.toLowerCase().replace(/\s+/g, '-') === code)
    ?? decodeURIComponent(code).replace(/-/g, ' ')

  return {
    title: `${countryName} · AfriFlix`,
    description: `Discover African creators and content from ${countryName} — films, music, poetry, dance and more on AfriFlix.`,
  }
}

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const countryName = AFRICAN_COUNTRIES.find(c => c.toLowerCase().replace(/\s+/g, '-') === code)
    ?? decodeURIComponent(code).replace(/-/g, ' ')

  if (!countryName) notFound()

  const { works, creators } = await getCountryContent(countryName)
  const total = works.length + creators.length

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/explore" className="text-xs text-ivory-dim hover:text-gold transition-colors font-mono mb-4 inline-block">
            ← Back to Explore
          </Link>
          <div className="flex items-start gap-4">
            <div>
              <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Country</p>
              <h1 className="font-syne font-extrabold text-4xl sm:text-5xl text-ivory">{countryName}</h1>
              {total > 0 && (
                <p className="text-ivory-dim mt-2">
                  {creators.length} creator{creators.length !== 1 ? 's' : ''} · {works.length} work{works.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {total === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🌍</p>
            <p className="font-syne text-ivory mb-2">No content from {countryName} yet</p>
            <p className="text-ivory-dim text-sm max-w-md mx-auto mb-6">
              Be the first creator from {countryName} to upload your work.
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-3 bg-gold text-black font-syne font-semibold rounded-xl hover:bg-gold-light transition-colors"
            >
              Join as Creator
            </Link>
          </div>
        ) : (
          <>
            {creators.length > 0 && (
              <section className="mb-12">
                <h2 className="font-syne font-semibold text-xl text-ivory mb-5">
                  Creators from {countryName}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {creators.map(creator => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </section>
            )}

            {works.length > 0 && (
              <section>
                <h2 className="font-syne font-semibold text-xl text-ivory mb-5">
                  Content from {countryName}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {works.map((work, i) => (
                    <WorkCard key={work.id} work={work} index={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCount, formatDuration, timeAgo } from '@/lib/utils'
import type { Album, Work } from '@/types'
import { AlbumTrackList } from './track-list'

async function getAlbum(id: string): Promise<Album | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('albums')
    .select('*, creator:creators(*)')
    .eq('id', id)
    .single()
  return data as Album | null
}

async function getTracks(albumId: string): Promise<Work[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('works')
    .select('*, creator:creators(display_name, username, avatar_url)')
    .eq('album_id', albumId)
    .eq('status', 'published')
    .order('track_number', { ascending: true })
  return (data as Work[]) ?? []
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const album = await getAlbum(params.id)
  if (!album) return {}
  return {
    title: album.title,
    description: album.description ?? undefined,
    openGraph: {
      title: album.title,
      description: album.description ?? undefined,
      images: album.cover_url ? [{ url: album.cover_url }] : [],
    },
  }
}

const ALBUM_TYPE_LABEL: Record<string, string> = {
  album: 'Album',
  ep: 'EP',
  single: 'Single',
  mixtape: 'Mixtape',
  live_session: 'Live Session',
}

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const [album, tracks] = await Promise.all([
    getAlbum(params.id),
    getTracks(params.id),
  ])

  if (!album) notFound()

  const totalDuration = tracks.reduce((s, t) => s + (t.audio_duration_seconds ?? 0), 0)
  const totalViews = tracks.reduce((s, t) => s + t.view_count, 0)
  const allGenres = Array.from(new Set(tracks.flatMap(t => t.genres))).slice(0, 5)
  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : null

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Album header */}
        <div className="flex flex-col sm:flex-row gap-8 mb-10">
          {/* Cover art */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden flex-shrink-0 shadow-gold mx-auto sm:mx-0">
            {album.cover_url ? (
              <Image
                src={album.cover_url}
                alt={album.title}
                fill
                className="object-cover"
                priority
                sizes="256px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-terra/20 flex items-center justify-center kente-bg">
                <span className="font-syne font-extrabold text-8xl text-gold/20 select-none">
                  {album.title[0]}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="dark">
                {ALBUM_TYPE_LABEL[album.album_type] ?? album.album_type}
              </Badge>
              <Badge variant="dark">Music</Badge>
            </div>

            <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-ivory leading-tight">
              {album.title}
            </h1>

            {album.creator && (
              <Link
                href={`/creator/${album.creator.username}`}
                className="flex items-center gap-2 group w-fit"
              >
                <div className="w-7 h-7 rounded-full bg-gold/20 overflow-hidden">
                  {album.creator.avatar_url ? (
                    <Image
                      src={album.creator.avatar_url}
                      alt={album.creator.display_name}
                      width={28}
                      height={28}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-syne font-bold text-gold">
                      {album.creator.display_name[0]}
                    </div>
                  )}
                </div>
                <span className="font-syne font-semibold text-ivory group-hover:text-gold transition-colors">
                  {album.creator.display_name}
                </span>
              </Link>
            )}

            {album.description && (
              <p className="text-ivory-mid text-sm leading-relaxed max-w-lg">{album.description}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-ivory-dim">
              {releaseYear && <span>{releaseYear}</span>}
              <span>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
              {totalDuration > 0 && <span>{formatDuration(totalDuration)}</span>}
              {totalViews > 0 && <span>{formatCount(totalViews)} plays</span>}
            </div>

            {/* Genres */}
            {allGenres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allGenres.map(g => (
                  <Badge key={g} variant="dark">{g}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Track listing */}
        {tracks.length > 0 ? (
          <AlbumTrackList tracks={tracks} album={album} />
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎵</p>
            <p className="font-syne text-ivory mb-2">No tracks yet</p>
            <p className="text-ivory-dim text-sm">The creator is still uploading tracks. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}

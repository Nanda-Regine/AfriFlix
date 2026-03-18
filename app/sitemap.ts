import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
  { url: `${BASE}/explore`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  { url: `${BASE}/collabs`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
  { url: `${BASE}/search`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  { url: `${BASE}/category/film`,       lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
  { url: `${BASE}/category/music`,      lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
  { url: `${BASE}/category/dance`,      lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE}/category/writing`,    lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE}/category/poetry`,     lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE}/category/comedy`,     lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE}/category/theatre`,    lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
  { url: `${BASE}/category/visual-art`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient()

    const [{ data: works }, { data: creators }, { data: collabs }] = await Promise.all([
      supabase
        .from('works')
        .select('id, updated_at:created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('creators')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('collabs')
        .select('id, created_at')
        .eq('status', 'open')
        .limit(100),
    ])

    const workRoutes: MetadataRoute.Sitemap = (works ?? []).map(w => ({
      url: `${BASE}/work/${w.id}`,
      lastModified: new Date(w.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const creatorRoutes: MetadataRoute.Sitemap = (creators ?? []).map(c => ({
      url: `${BASE}/creator/${c.username}`,
      lastModified: new Date(c.created_at),
      changeFrequency: 'weekly',
      priority: 0.65,
    }))

    const collabRoutes: MetadataRoute.Sitemap = (collabs ?? []).map(c => ({
      url: `${BASE}/collabs/${c.id}`,
      lastModified: new Date(c.created_at),
      changeFrequency: 'daily',
      priority: 0.6,
    }))

    return [...STATIC_ROUTES, ...workRoutes, ...creatorRoutes, ...collabRoutes]
  } catch {
    return STATIC_ROUTES
  }
}

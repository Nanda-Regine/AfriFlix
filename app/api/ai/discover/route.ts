import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL, safeParseJSON, checkRateLimit, cachedSystem } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { MoodRecommendation, Work, TasteProfile } from '@/types'

export async function POST(req: Request) {
  try {
    const { userId, mood, category } = await req.json()

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 })
    }

    // Rate limit
    const limitKey = userId ?? req.headers.get('x-forwarded-for') ?? 'anon'
    if (!await checkRateLimit(limitKey, 10, 60_000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = await createClient()

    // Get candidate works from database
    let query = supabase
      .from('works')
      .select('id, title, category, ai_summary, mood_tags, theme_tags, view_count')
      .eq('status', 'published')
      .contains('mood_tags', [mood])
      .limit(50)

    if (category) query = query.eq('category', category)

    const { data: candidates } = await query

    // If no mood-tagged candidates, fall back to trending
    let works = (candidates as Work[]) ?? []
    if (works.length < 5) {
      const { data: fallback } = await supabase
        .from('works')
        .select('id, title, category, ai_summary, mood_tags, theme_tags, view_count')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(20)
      works = (fallback as Work[]) ?? []
    }

    if (works.length === 0) {
      return NextResponse.json({
        work_ids: [],
        curation_note: `Nothing yet for this mood — creators are uploading new ${category ?? 'content'} daily. Check back soon.`
      })
    }

    // Get taste profile and history if user is logged in
    let tasteProfile: TasteProfile | null = null
    let recentHistory: string[] = []

    if (userId && userId !== 'anonymous') {
      const [profileData, historyData] = await Promise.all([
        supabase.from('taste_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('history').select('work_id').eq('user_id', userId).order('last_watched', { ascending: false }).limit(20),
      ])
      tasteProfile = profileData.data as TasteProfile | null
      recentHistory = ((historyData.data ?? []) as { work_id: string }[]).map(h => h.work_id)
    }

    const availableCandidates = works.filter(w => !recentHistory.includes(w.id))
    const toRank = availableCandidates.length > 0 ? availableCandidates : works

    const DISCOVER_SYSTEM = `You are AfriFlix's discovery engine. You have deep knowledge of African creative content across all 54 nations. Your job is to rank candidate works by how well they match the user's current mood and taste profile. Return valid JSON only.`

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system: cachedSystem(DISCOVER_SYSTEM),
      messages: [{
        role: 'user',
        content: `Select the best works for this user right now.

User mood: "${mood}"
${tasteProfile ? `User taste: ${JSON.stringify({ categories: tasteProfile.preferred_categories, genres: tasteProfile.preferred_genres, languages: tasteProfile.preferred_languages })}` : 'No taste profile yet.'}
${recentHistory.length > 0 ? `Avoid recently watched IDs: ${recentHistory.slice(0, 10).join(', ')}` : ''}

Available works:
${JSON.stringify(toRank.slice(0, 30).map(w => ({
  id: w.id,
  title: w.title,
  category: w.category,
  summary: w.ai_summary,
  mood_tags: w.mood_tags,
})))}

Return valid JSON only (no markdown):
{
  "work_ids": ["ordered array of up to 10 work IDs — best match first"],
  "curation_note": "1 warm sentence explaining the selection — as if from a knowledgeable African creative friend"
}`,
      }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const result = safeParseJSON<MoodRecommendation>(raw)

    if (!result) {
      // Fallback: return first 10 works
      return NextResponse.json({
        work_ids: toRank.slice(0, 10).map(w => w.id),
        curation_note: `Here's what we found for your ${mood} mood right now.`,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[discover]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

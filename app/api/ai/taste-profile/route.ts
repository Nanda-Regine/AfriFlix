import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL, safeParseJSON, cachedSystem } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { TasteProfileResult } from '@/types'

export async function POST(req: Request) {
  try {
    const { answers, userId } = await req.json()

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: cachedSystem(`You are a creative AI curator with deep knowledge of African art, music, film, dance, writing, and cultural expression across all 54 African nations and the diaspora. You understand the full spectrum — from gqom to griot storytelling, Nollywood to Cape Town indie film, Lagos slam poetry to Nairobi afro-soul.`),
      messages: [{
        role: 'user',
        content: `Based on these onboarding quiz answers, generate a taste profile for a new AfriFlix user.

Answers: ${JSON.stringify(answers)}

Return valid JSON only (no markdown fences, no extra text):
{
  "preferred_categories": ["array of content categories from: film, music, dance, writing, poetry, comedy, theatre, visual_art"],
  "preferred_genres": ["array of specific genres"],
  "preferred_languages": ["array of languages"],
  "cultural_affinities": ["array of cultural groups or traditions"],
  "mood_preferences": ["array of moods from: energised, reflective, joyful, melancholic, inspired, restless"],
  "first_feed_description": "1 warm sentence describing their taste",
  "welcome_message": "personalised, warm welcome — 1-2 sentences. Use their likely language if they selected a non-English language, otherwise English"
}`,
      }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const profile = safeParseJSON<TasteProfileResult>(raw)

    if (!profile) {
      return NextResponse.json({ error: 'Failed to parse profile' }, { status: 500 })
    }

    // Save to Supabase if userId provided
    if (userId && userId !== 'anonymous') {
      const supabase = await createClient()
      await supabase.from('taste_profiles').upsert({
        user_id: userId,
        preferred_categories: profile.preferred_categories,
        preferred_genres: profile.preferred_genres,
        preferred_languages: profile.preferred_languages,
        cultural_affinities: profile.cultural_affinities,
        mood_preferences: profile.mood_preferences,
        onboarding_complete: true,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[taste-profile]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

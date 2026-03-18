import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL, safeParseJSON, checkRateLimit, cachedSystem } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import type { AIEnrichment } from '@/types'

const ENRICH_SYSTEM = `You are an African cultural curator and creative archivist. You understand the full spectrum of African creative expression — from gqom to griot storytelling, Nollywood to Cape Town indie film, Lagos slam poetry to Nairobi afro-soul. Your job is to generate discovery metadata that helps African audiences find this work.`

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    if (!await checkRateLimit(ip, 20, 60_000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { work } = await req.json()

    if (!work?.title || !work?.category) {
      return NextResponse.json({ error: 'Missing title or category' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: cachedSystem(ENRICH_SYSTEM),
      messages: [{
        role: 'user',
        content: `Enrich this AfriFlix content upload for discovery.

Title: ${work.title}
Category: ${work.category}
Description: ${work.description || 'Not provided'}
Country: ${work.country_of_origin || 'Not specified'}
Languages: ${work.languages?.join(', ') || 'Not specified'}
Genres: ${work.genres?.join(', ') || 'Not specified'}

Return valid JSON only (no markdown fences, no extra text):
{
  "ai_summary": "2-sentence evocative description that makes someone want to watch/listen/read — written like a cultural critic, not a press release",
  "mood_tags": ["max 4 moods from: energised, reflective, joyful, melancholic, inspired, restless, provocative, tender, celebratory, grief-stricken"],
  "theme_tags": ["max 6 themes — specific and culturally grounded, e.g. 'post-apartheid identity', 'Lagos hustle', 'ubuntu philosophy'"],
  "genre_suggestions": ["only suggest genres if not already provided above"],
  "cultural_context": "1 sentence on the cultural tradition or movement this belongs to",
  "recommended_for": ["3-5 taste profile tags this content would match"]
}`,
      }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const enrichment = safeParseJSON<AIEnrichment>(raw)

    if (!enrichment) {
      return NextResponse.json({ error: 'Failed to parse enrichment' }, { status: 500 })
    }

    return NextResponse.json(enrichment)
  } catch (error) {
    console.error('[enrich]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

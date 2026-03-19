/**
 * AI Creative DNA Generator
 * Claude analyses a creator's portfolio and writes their creative identity.
 * Called from dashboard when creator has 3+ published works.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL, cachedSystem, checkRateLimit } from '@/lib/claude'
import { isCsrfSafe } from '@/lib/csrf'

const HEADERS = { 'Cache-Control': 'no-store' }

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: HEADERS })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: HEADERS })

  const allowed = await checkRateLimit(`creative-dna:${user.id}`, 3, 86_400_000) // 3 per day
  if (!allowed) return NextResponse.json({ error: 'Rate limited — try again tomorrow' }, { status: 429, headers: HEADERS })

  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, bio, categories, languages, cultural_roots, country, is_diaspora')
    .eq('user_id', user.id)
    .single()

  if (!creator) return NextResponse.json({ error: 'No creator profile' }, { status: 404, headers: HEADERS })

  const { data: works } = await supabase
    .from('works')
    .select('title, category, description, genres, languages, mood_tags, theme_tags, cultural_origin, country_of_origin, year_created')
    .eq('creator_id', creator.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  if (!works || works.length < 1) {
    return NextResponse.json({ error: 'Publish at least one work first' }, { status: 400, headers: HEADERS })
  }

  const systemPrompt = `You are AfriBrain, the creative intelligence at the heart of AfriFlix — Africa's premier creative platform. Your task is to generate a creator's "Creative DNA" — a vivid, honest, and empowering portrait of their artistic identity based on their portfolio.

Write in a warm, clear, inspirational voice. Be specific to their actual work. Avoid generic praise. Surface the patterns, obsessions, and signatures that make this creator unique.

Output a JSON object with exactly these fields:
{
  "headline": "8-10 word headline that captures their creative essence",
  "voice": "One paragraph (60-80 words) describing their distinctive voice, aesthetic signature, and what makes their work unmistakably theirs",
  "themes": "One paragraph (50-70 words) identifying the recurring themes, questions, or obsessions that run through their work",
  "power": "One sentence (15-25 words) — the single thing they do better than almost anyone. Their superpower.",
  "direction": "One paragraph (50-70 words) of forward-looking creative direction — what territory they seem ready to explore next, what their work is building toward",
  "tags": ["array", "of", "5-8", "creative identity tags"]
}`

  const portfolioText = works.map((w, i) =>
    `${i + 1}. "${w.title}" [${w.category}] — Genres: ${w.genres?.join(', ') || 'none'} | Moods: ${w.mood_tags?.join(', ') || 'none'} | Themes: ${w.theme_tags?.join(', ') || 'none'} | Languages: ${w.languages?.join(', ') || 'none'} | Cultural origin: ${w.cultural_origin || 'unspecified'}${w.description ? ` | Description: ${w.description.slice(0, 120)}` : ''}`
  ).join('\n')

  const userMessage = `Creator: ${creator.display_name}
Country: ${creator.country}${creator.is_diaspora ? ' (diaspora)' : ''}
Categories: ${creator.categories?.join(', ') || 'unspecified'}
Languages: ${creator.languages?.join(', ') || 'unspecified'}
Cultural roots: ${creator.cultural_roots?.join(', ') || 'unspecified'}
Bio: ${creator.bio || 'None provided'}

Portfolio (${works.length} published works):
${portfolioText}

Generate this creator's Creative DNA.`

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: cachedSystem(systemPrompt),
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = (response.content[0] as { text: string }).text
    let dna: Record<string, unknown>
    try {
      const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      dna = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AI response parse error' }, { status: 500, headers: HEADERS })
    }

    // Save to creator profile
    await supabase
      .from('creators')
      .update({
        creative_dna: JSON.stringify(dna),
        creative_dna_updated_at: new Date().toISOString(),
      })
      .eq('id', creator.id)

    return NextResponse.json({ dna }, { headers: HEADERS })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI error'
    return NextResponse.json({ error: msg }, { status: 500, headers: HEADERS })
  }
}

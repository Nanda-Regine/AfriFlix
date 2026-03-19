/**
 * AfriBrain — Platform-wide AI oracle
 * Claude knows the platform: can surface creators, works, moods, vibes.
 * Uses platform context injected into the system prompt.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL, cachedSystem, checkRateLimit } from '@/lib/claude'
import { isCsrfSafe } from '@/lib/csrf'

const HEADERS = { 'Cache-Control': 'no-store' }

const SYSTEM = `You are AfriBrain — the creative intelligence of AfriFlix, Africa's premier platform for African film, music, dance, poetry, writing, comedy, theatre, and visual art. You represent all 54 African nations and the global diaspora.

Your personality: warm, culturally fluent, knowledgeable, inspiring. You speak like a brilliant friend who has watched everything, heard everything, read everything on AfriFlix. You are not generic — you are specific, evocative, and deeply African.

Your capabilities:
- Discover works by mood, vibe, language, country, theme, genre
- Recommend creators based on creative style
- Explain the cultural context of works and art forms
- Help fans find exactly what they're looking for
- Help creators understand what's resonating on the platform

When recommending works or creators, format them clearly with title/name and why you're recommending them.

If asked about something outside AfriFlix's creative scope, gently redirect to what you know.

Be concise. Maximum 3 paragraphs per response. Use line breaks for readability. Never use markdown headers or bullet points — write naturally.`

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: HEADERS })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const identifier = user?.id ?? (req.headers.get('x-forwarded-for') ?? 'anon')

  const allowed = await checkRateLimit(`afribrain:${identifier}`, 20, 60_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Take a breath.' }, { status: 429, headers: HEADERS })

  let body: { messages: { role: string; content: string }[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: HEADERS }) }

  const { messages } = body
  if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400, headers: HEADERS })

  // Fetch recent platform context to help Claude answer
  const [worksRes, creatorsRes] = await Promise.all([
    supabase
      .from('works')
      .select('id, title, category, genres, mood_tags, theme_tags, languages, cultural_origin, view_count, heart_count, creator:creators(display_name, username, country)')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(30),
    supabase
      .from('creators')
      .select('id, display_name, username, country, categories, languages, cultural_roots, follower_count')
      .eq('is_featured', true)
      .order('follower_count', { ascending: false })
      .limit(20),
  ])

  const works = worksRes.data ?? []
  const creators = creatorsRes.data ?? []

  const platformContext = works.length > 0
    ? `\n\nCurrent platform snapshot:\n\nTop works:\n${works.slice(0, 20).map(w => {
        const cr = Array.isArray(w.creator) ? w.creator[0] : (w.creator as { display_name?: string } | null)
        return `• "${w.title}" [${w.category}] by ${cr?.display_name ?? 'Unknown'} — moods: ${w.mood_tags?.join(', ') || 'none'} | genres: ${w.genres?.join(', ') || 'none'} | ${w.view_count} views`
      }).join('\n')}\n\nFeatured creators:\n${creators.map(c =>
        `• ${c.display_name} (@${c.username}) — ${c.country} | ${c.categories?.join(', ')} | ${c.follower_count} followers`
      ).join('\n')}`
    : ''

  const systemWithContext = SYSTEM + platformContext

  // Validate and sanitize messages
  const safeMessages = messages
    .slice(-10) // max 10 turns
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: String(m.content).slice(0, 1000) }))

  if (safeMessages[safeMessages.length - 1]?.role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from user' }, { status: 400, headers: HEADERS })
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: cachedSystem(systemWithContext),
      messages: safeMessages,
    })

    const text = (response.content[0] as { text: string }).text
    return NextResponse.json({ response: text }, { headers: HEADERS })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI error'
    return NextResponse.json({ error: msg }, { status: 500, headers: HEADERS })
  }
}

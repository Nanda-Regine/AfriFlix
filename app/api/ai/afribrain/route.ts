/**
 * AfriBrain — Platform-wide AI oracle
 *
 * Cost optimisations:
 * - Platform context (top works + creators) cached in Redis for 15 min
 * - Identical single-turn responses cached for 15 min
 * - System prompt cached with Claude prompt caching (10% of base token cost on reads)
 * - 20 req/min per user hard rate limit
 * - Token budget: 50K tokens/user/day soft cap
 * - Max 500 output tokens, 10 turns, 800 chars/message
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  anthropic, CLAUDE_MODEL, cachedSystem, checkRateLimit,
  getCachedPlatformContext, setCachedPlatformContext,
  getCachedResponse, setCachedResponse,
  checkTokenBudget, recordTokenUsage,
} from '@/lib/claude'
import { isCsrfSafe } from '@/lib/csrf'
import { parseJsonBody, sanitizeText } from '@/lib/security'

const NO_STORE = { 'Cache-Control': 'no-store' }

const SYSTEM = `You are AfriBrain — the creative intelligence of AfriFlix, Africa's premier platform for African film, music, dance, poetry, writing, comedy, theatre, and visual art. You represent all 54 African nations and the global diaspora.

Your personality: warm, culturally fluent, knowledgeable, inspiring. You speak like a brilliant friend who has watched everything, heard everything, read everything on AfriFlix. You are not generic — you are specific, evocative, and deeply African.

Capabilities:
- Discover works by mood, vibe, language, country, theme, genre
- Recommend creators based on creative style
- Explain cultural context of art forms
- Help fans find exactly what they need
- Surface platform insights for creators

Rules:
- Maximum 3 paragraphs per response
- No markdown headers or bullet points — write naturally
- When recommending, name specific works/creators and why
- If outside AfriFlix scope, redirect warmly`

async function buildPlatformContext(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never): Promise<string> {
  const cached = await getCachedPlatformContext()
  if (cached) return cached

  const [worksRes, creatorsRes] = await Promise.all([
    supabase
      .from('works')
      .select('title, category, genres, mood_tags, view_count, creator:creators(display_name, country)')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(20),
    supabase
      .from('creators')
      .select('display_name, username, country, categories, follower_count')
      .eq('is_featured', true)
      .order('follower_count', { ascending: false })
      .limit(12),
  ])

  const works = worksRes.data ?? []
  const creators = creatorsRes.data ?? []

  const context = works.length === 0 ? '' : `\n\nPlatform snapshot (cached):\n\nTop works:\n${
    works.map(w => {
      const cr = Array.isArray(w.creator) ? w.creator[0] : w.creator as { display_name?: string; country?: string } | null
      return `• "${w.title}" [${w.category}] by ${cr?.display_name ?? 'Unknown'} (${cr?.country ?? ''}) — moods: ${(w.mood_tags as string[] | null)?.join(', ') || 'none'} | ${w.view_count} views`
    }).join('\n')
  }\n\nFeatured creators:\n${
    creators.map(c => `• ${c.display_name} (@${c.username}) — ${c.country} | ${(c.categories as string[] | null)?.join(', ')} | ${c.follower_count} followers`).join('\n')
  }`

  await setCachedPlatformContext(context)
  return context
}

export async function POST(req: Request) {
  if (!isCsrfSafe(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const identifier = user?.id ?? 'anon:' + (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown')

  // Rate limit: 20/min per user
  const allowed = await checkRateLimit(`afribrain:${identifier}`, 20, 60_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Take a breath.' }, { status: 429, headers: NO_STORE })

  // Token budget check
  const budgetOk = await checkTokenBudget(identifier, 1500) // estimate 1K input + 500 output
  if (!budgetOk) return NextResponse.json({ error: 'Daily AI limit reached. Come back tomorrow.' }, { status: 429, headers: NO_STORE })

  const [body, parseError] = await parseJsonBody<{ messages: { role: string; content: string }[] }>(req, 32 * 1024)
  if (parseError || !body?.messages?.length) {
    return NextResponse.json({ error: parseError ?? 'No messages' }, { status: 400, headers: NO_STORE })
  }

  // Sanitize and validate messages
  const safeMessages = body.messages
    .slice(-8) // max 8 turns (reduced from 10 for cost)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: sanitizeText(m.content, 800),
    }))
    .filter(m => m.content.length > 0)

  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from user' }, { status: 400, headers: NO_STORE })
  }

  const lastUserMsg = safeMessages[safeMessages.length - 1].content

  // For single-turn queries, check response cache first
  const isSingleTurn = safeMessages.length === 1
  if (isSingleTurn) {
    const cached = await getCachedResponse(CLAUDE_MODEL, SYSTEM, lastUserMsg)
    if (cached) return NextResponse.json({ response: cached }, { headers: NO_STORE })
  }

  const context = await buildPlatformContext(supabase)
  const systemWithContext = SYSTEM + context

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: cachedSystem(systemWithContext),
      messages: safeMessages,
    })

    const text = (response.content[0] as { text: string }).text

    // Cache single-turn responses + record usage
    if (isSingleTurn) await setCachedResponse(CLAUDE_MODEL, SYSTEM, lastUserMsg, text)
    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
    if (user?.id) await recordTokenUsage(user.id, tokensUsed)

    return NextResponse.json({ response: text }, { headers: NO_STORE })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI error'
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE })
  }
}

import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL, checkRateLimit, cachedSystem, withCache } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

const DISCOVERY_SYSTEM = `You are AfriFlix's friendly AI content guide. You have deep knowledge of African cinema, music, poetry, dance, writing, comedy, theatre, and storytelling from all 54 African nations and the diaspora.

Your role: help users discover content based on their interests and mood. Keep responses warm, conversational, and under 3 sentences. Suggest 1-2 specific titles or creators when relevant.

When recommending, think: what would a knowledgeable African creative friend suggest? Be specific, culturally grounded, and enthusiastic.`

const CREATOR_SYSTEM = `You are an AI creative partner for African creators on AfriFlix — powered by Claude. You have deep knowledge of:
- African film, music, dance, poetry, writing, comedy, theatre, and visual art
- The African creative industry: distribution, monetisation, promotion, cultural context
- AfriFlix's platform: how discovery works, what metadata matters, how to reach audiences
- African creative movements: Nollywood, Cape Town indie, amapiano, afrobeats, slam poetry, etc.

You help creators with: bio writing, content descriptions, genre tagging, press releases, collab listings, analytics interpretation, and creative strategy.

Be specific, culturally grounded, and practical. Never give generic advice. Reference real African creative context when relevant. Format responses clearly — use bullet points or numbered lists when listing multiple items.`

export async function POST(req: Request) {
  try {
    const { messages, creatorContext, mode = 'discovery' } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Auth check for creator mode
    if (mode === 'creator') {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Rate limit per user
      if (!await checkRateLimit(user.id, 30, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }

      // Check creator pro
      const { data: creator } = await supabase.from('creators').select('plan').eq('user_id', user.id).single()
      if (creator?.plan === 'free') {
        return NextResponse.json({ error: 'Creator Pro required' }, { status: 403 })
      }
    } else {
      // Discovery mode: rate limit by IP
      const ip = req.headers.get('x-forwarded-for') ?? 'anon'
      if (!await checkRateLimit(ip, 15, 60_000)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    }

    // Static system prompt is cached — dynamic creator context is prepended to first user message
    const systemPrompt = cachedSystem(mode === 'creator' ? CREATOR_SYSTEM : DISCOVERY_SYSTEM)

    // For creator mode, inject context into the conversation as a priming user turn
    const builtMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Cache up to the second-to-last message in multi-turn to save on long conversations
    const cachedMessages = builtMessages.length > 2 ? withCache(builtMessages.slice(0, -1)).concat(builtMessages.slice(-1)) : builtMessages

    const contextPrefix = mode === 'creator' && creatorContext
      ? `[Context: ${JSON.stringify(creatorContext)}]\n\n`
      : ''

    if (contextPrefix && cachedMessages.length > 0 && cachedMessages[0].role === 'user') {
      cachedMessages[0] = {
        ...cachedMessages[0],
        content: contextPrefix + (typeof cachedMessages[0].content === 'string' ? cachedMessages[0].content : ''),
      }
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: mode === 'creator' ? 800 : 250,
      system: systemPrompt,
      messages: cachedMessages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[creator-assistant]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

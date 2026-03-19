import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_HAIKU, checkRateLimit, cachedSystem } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anon'
    if (!await checkRateLimit(ip, 60, 60_000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { title, category } = await req.json()

    if (!title || !category) {
      return NextResponse.json({ error: 'Missing title or category' }, { status: 400 })
    }

    const CARD_DESC_SYSTEM = `You are AfriFlix's cinematic copywriter. Write one sentence — maximum 20 words — that makes someone desperate to watch, listen to, or read a piece of African creative content. Start with an action verb or strong emotion. No spoilers. Deeply African in tone. Return only the sentence, no quotes.`

    const response = await anthropic.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 80,
      system: cachedSystem(CARD_DESC_SYSTEM),
      messages: [{
        role: 'user',
        content: `African ${category}: "${title}"`,
      }],
    })

    const description = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return NextResponse.json({ description })
  } catch (error) {
    console.error('[card-description]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

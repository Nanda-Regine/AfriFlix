import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL, checkRateLimit } from '@/lib/claude'

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

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Write one cinematic, evocative sentence that makes someone desperate to watch/listen/read this African ${category}: "${title}".

Rules:
- Maximum 20 words
- Start with an action verb or strong emotion
- No spoilers
- Deeply African in tone and imagery
- Make it irresistible

Return only the sentence, no punctuation at start, no quotes.`,
      }],
    })

    const description = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return NextResponse.json({ description })
  } catch (error) {
    console.error('[card-description]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

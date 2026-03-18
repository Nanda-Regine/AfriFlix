'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatMessage, Creator } from '@/types'

const QUICK_PROMPTS = [
  "Review my bio — is it compelling?",
  "Write a description for my latest work",
  "What genre tags should I use?",
  "Generate a press release for my release",
  "Help me write a collab listing",
  "What's working in my analytics?",
  "Best time to publish in my country?",
]

interface CreatorAssistantProps {
  creator: Creator
}

export function CreatorAssistant({ creator }: CreatorAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content, timestamp: Date.now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/creator-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          creatorContext: {
            displayName: creator.display_name,
            categories: creator.categories,
            country: creator.country,
            bio: creator.bio,
            plan: creator.plan,
          },
          mode: 'creator',
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: Date.now() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Something went wrong. Please try again.",
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <div className="p-4 border-b border-white/10 bg-black-card rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-syne font-bold">
            AI
          </div>
          <div>
            <p className="font-syne font-semibold text-ivory text-sm">Claude Creative Assistant</p>
            <p className="text-xs text-gold">Powered by Claude — Creator Pro feature</p>
          </div>
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="p-4 border-b border-white/10">
          <p className="text-xs font-syne text-ivory-dim uppercase tracking-wider mb-3">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-3 py-2 bg-black-card border border-white/10 text-ivory-dim rounded-lg hover:border-gold/30 hover:text-gold transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-[400px]">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤖</div>
            <p className="font-syne text-ivory mb-2">Your AI creative partner</p>
            <p className="text-sm text-ivory-dim max-w-xs mx-auto">
              I know African culture, creative industries, and the Afriflix platform. Ask me anything about your creative work.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn(
              'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-syne font-semibold',
              msg.role === 'assistant' ? 'bg-gold/20 text-gold' : 'bg-terra/20 text-terra-light'
            )}>
              {msg.role === 'assistant' ? 'AI' : creator.display_name[0]}
            </div>
            <div className={cn(
              'max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap',
              msg.role === 'user'
                ? 'bg-terra/10 border border-terra/20 text-ivory'
                : 'bg-black-card border border-white/10 text-ivory'
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gold/20 flex-shrink-0 flex items-center justify-center text-xs text-gold font-syne font-semibold">AI</div>
            <div className="bg-black-card border border-white/10 rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-ivory-dim animate-typing" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-ivory-dim animate-typing" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 rounded-full bg-ivory-dim animate-typing" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask your AI creative partner..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-black-card border border-white/10 rounded-xl text-ivory placeholder:text-ivory-dim text-sm focus:outline-none focus:border-gold/40 transition-colors"
          />
          <Button type="submit" variant="gold" size="sm" disabled={!input.trim()} loading={loading}>
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

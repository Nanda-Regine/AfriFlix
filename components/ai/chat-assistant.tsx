'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn, timeAgo } from '@/lib/utils'
import type { ChatMessage } from '@/types'

const SUGGESTED_PROMPTS = [
  'Something powerful',
  'I need to laugh',
  'South African stories',
  'Spoken word poetry',
]

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, open])

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return
    setShowSuggestions(false)
    const userMessage: ChatMessage = { role: 'user', content, timestamp: Date.now() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/creator-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          creatorContext: null,
          mode: 'discovery', // discovery mode for chat assistant (not creator mode)
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Apologies, something went wrong. Please try again.",
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask AfriFlix AI assistant"
        className={cn(
          'fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full',
          'bg-gold-gradient text-black shadow-gold hover:shadow-gold-strong hover:scale-105',
          'flex items-center justify-center text-xl transition-all duration-200',
          open && 'hidden'
        )}
      >
        🌍
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[calc(100vw-24px)] flex flex-col bg-black-mid border border-white/10 rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black-card">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <div>
                <p className="font-syne font-semibold text-ivory text-sm">Ask AfriFlix</p>
                <p className="text-xs text-gold">AI Content Guide</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-ivory-dim hover:text-ivory transition-colors p-1"
              aria-label="Close chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px] max-h-[400px]">
            {/* Greeting */}
            {messages.length === 0 && (
              <div className="flex gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">🌍</span>
                <div className="bg-black-card border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-ivory leading-relaxed">
                    <strong className="text-gold">Sawubona!</strong> I'm your AfriFlix guide. I know African cinema, music, poetry, dance, and storytelling from all 54 nations. What are you in the mood for?
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && <span className="text-base flex-shrink-0 mt-0.5">🌍</span>}
                <div
                  className={cn(
                    'px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-terra/20 border border-terra/30 text-ivory rounded-tr-none'
                      : 'bg-black-card border border-white/10 text-ivory rounded-tl-none'
                  )}
                >
                  {msg.content}
                  {msg.timestamp && (
                    <p className="text-[10px] mt-1.5 opacity-50 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">🌍</span>
                <div className="bg-black-card border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-ivory-dim animate-typing" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-ivory-dim animate-typing" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 rounded-full bg-ivory-dim animate-typing" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-white/5">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 bg-black-card border border-white/10 text-ivory-dim rounded-pill hover:border-gold/30 hover:text-gold transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-white/10">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about African content..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-black-card border border-white/10 rounded-pill text-ivory placeholder:text-ivory-dim text-sm focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold-light disabled:opacity-40 transition-colors flex-shrink-0"
              aria-label="Send"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

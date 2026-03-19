'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Find Swahili spoken word about identity',
  'Who are the top film creators this week?',
  'Show me uplifting music from West Africa',
  'I need comedy that feels like home',
]

export function AfriBrain() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function send(text?: string) {
    const message = text ?? input.trim()
    if (!message || loading) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: message }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/afribrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gold shadow-lg shadow-gold/30 flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Ask AfriBrain"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:w-96 bg-black-mid border border-white/10 rounded-2xl shadow-2xl shadow-black flex flex-col overflow-hidden"
            style={{ maxHeight: '80vh', minHeight: '400px' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M8 12h.01M12 12h.01M16 12h.01" />
                  </svg>
                </div>
                <div>
                  <p className="font-syne font-bold text-sm text-ivory leading-none">AfriBrain</p>
                  <p className="text-[10px] text-ivory-dim">Powered by Claude · Knows everything on AfriFlix</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-ivory-dim hover:text-ivory transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-ivory-mid text-center">Ask me anything about AfriFlix — I know every creator, every work, every vibe.</p>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left px-3 py-2.5 rounded-xl bg-black-card border border-white/5 text-xs text-ivory-mid hover:border-gold/20 hover:text-ivory transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gold text-black font-medium rounded-br-sm'
                        : 'bg-black-card text-ivory-mid rounded-bl-sm'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-black-card rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5">
              <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask AfriBrain anything..."
                  className="flex-1 bg-black-card border border-white/10 rounded-xl px-3 py-2.5 text-ivory text-sm placeholder:text-ivory-dim/50 focus:outline-none focus:border-gold/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const QUESTIONS = [
  {
    id: 'vibe',
    question: "Which of these sounds like a perfect Sunday?",
    options: [
      { label: "Watching a thought-provoking short film", value: "film" },
      { label: "Losing yourself in an album", value: "music" },
      { label: "Reading something that makes you feel seen", value: "writing" },
      { label: "Watching a live dance performance", value: "dance" },
      { label: "Listening to spoken word poetry", value: "poetry" },
    ],
    multi: false,
  },
  {
    id: 'sound',
    question: "Which African sound moves you most?",
    options: [
      { label: "Amapiano", value: "amapiano" },
      { label: "Afrobeats", value: "afrobeats" },
      { label: "Gqom", value: "gqom" },
      { label: "Highlife", value: "highlife" },
      { label: "Afro-soul", value: "afro-soul" },
      { label: "Traditional / cultural", value: "traditional" },
    ],
    multi: false,
  },
  {
    id: 'language',
    question: "What languages do you connect with creatively?",
    options: [
      { label: "English", value: "english" },
      { label: "isiZulu", value: "isizulu" },
      { label: "isiXhosa", value: "isixhosa" },
      { label: "Yoruba", value: "yoruba" },
      { label: "Swahili", value: "swahili" },
      { label: "French", value: "french" },
      { label: "Afrikaans", value: "afrikaans" },
      { label: "Another African language", value: "other_african" },
    ],
    multi: true,
  },
  {
    id: 'feeling',
    question: "What do you want to feel when you discover something new?",
    options: [
      { label: "Moved / emotional", value: "moved" },
      { label: "Energised / hype", value: "energised" },
      { label: "Seen / represented", value: "seen" },
      { label: "Educated / woke", value: "educated" },
      { label: "Entertained / laugh", value: "entertained" },
      { label: "Inspired to create", value: "inspired" },
    ],
    multi: false,
  },
  {
    id: 'origin',
    question: "Where are you from / connected to?",
    options: [
      { label: "South Africa", value: "south_africa" },
      { label: "Nigeria", value: "nigeria" },
      { label: "Ghana", value: "ghana" },
      { label: "Kenya", value: "kenya" },
      { label: "Zimbabwe", value: "zimbabwe" },
      { label: "East Africa", value: "east_africa" },
      { label: "West Africa", value: "west_africa" },
      { label: "North Africa", value: "north_africa" },
      { label: "Central Africa", value: "central_africa" },
      { label: "Diaspora", value: "diaspora" },
    ],
    multi: true,
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [loading, setLoading] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null)
  const router = useRouter()

  const question = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  function toggleAnswer(id: string, value: string, multi: boolean) {
    setAnswers(prev => {
      if (multi) {
        const current = (prev[id] as string[]) ?? []
        return {
          ...prev,
          [id]: current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value],
        }
      }
      return { ...prev, [id]: value }
    })
  }

  function isSelected(id: string, value: string): boolean {
    const ans = answers[id]
    if (Array.isArray(ans)) return ans.includes(value)
    return ans === value
  }

  function hasAnswer(): boolean {
    const ans = answers[question.id]
    if (Array.isArray(ans)) return ans.length > 0
    return !!ans
  }

  async function handleNext() {
    if (!isLast) { setStep(s => s + 1); return }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/taste-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setWelcomeMessage(data.welcome_message)
      setTimeout(() => router.push('/explore'), 3000)
    } catch {
      router.push('/explore')
    }
  }

  if (welcomeMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-6 animate-bounce">🌍</div>
        <h2 className="font-syne font-bold text-3xl text-ivory mb-4">Welcome to AfriFlix!</h2>
        <p className="text-ivory-mid text-lg max-w-md">{welcomeMessage}</p>
        <p className="text-ivory-dim text-sm mt-4 font-mono">Taking you to your personalised feed...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= step ? 'bg-gold' : 'bg-white/10')}
            />
          ))}
        </div>

        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-3">
          Question {step + 1} of {QUESTIONS.length}
        </p>

        <h2 className="font-syne font-bold text-2xl sm:text-3xl text-ivory mb-8">
          {question.question}
        </h2>

        {question.multi && (
          <p className="text-xs text-ivory-dim mb-4">Select all that apply</p>
        )}

        <div className="flex flex-wrap gap-3 mb-10">
          {question.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleAnswer(question.id, opt.value, question.multi)}
              className={cn(
                'px-5 py-3 rounded-xl border font-syne text-sm transition-all duration-200',
                isSelected(question.id, opt.value)
                  ? 'bg-gold/20 border-gold text-gold shadow-gold'
                  : 'bg-black-card border-white/10 text-ivory-mid hover:border-white/30 hover:text-ivory'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Button>
          ) : (
            <div />
          )}
          <Button
            variant="gold"
            onClick={handleNext}
            disabled={!hasAnswer()}
            loading={loading}
          >
            {isLast ? 'Build My Feed' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

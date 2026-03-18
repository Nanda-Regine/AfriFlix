import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorAssistant } from '@/components/ai/creator-assistant'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Creator } from '@/types'

export default async function AIAssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creators').select('*').eq('user_id', user.id).single()

  if (!creator) {
    return (
      <div className="text-center py-16">
        <p className="text-ivory-dim">Set up your creator profile first.</p>
      </div>
    )
  }

  if (creator.plan === 'free') {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="text-5xl mb-6">🤖</div>
        <h2 className="font-syne font-bold text-2xl text-ivory mb-3">AI Creative Assistant</h2>
        <p className="text-ivory-mid mb-2">
          Your personal AI partner — powered by Claude. Get help with bios, descriptions, press releases, genre tagging, and creative strategy.
        </p>
        <p className="text-ivory-dim text-sm mb-8">Available on Creator Pro (R99/month)</p>
        <div className="bg-black-card border border-gold/20 rounded-xl p-6 mb-6 text-left">
          <p className="font-syne font-semibold text-ivory mb-3">What Claude can help you with:</p>
          <ul className="space-y-2 text-sm text-ivory-mid">
            {[
              '✍️ Bio writing and review',
              '🎬 Work descriptions that convert',
              '🏷️ Genre and mood tagging',
              '📰 Press releases and EPKs',
              '🤝 Collab listing writing',
              '📊 Analytics interpretation',
              '🕐 Optimal publishing time advice',
            ].map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <Link href="/dashboard/earnings">
          <Button variant="gold" size="lg">Upgrade to Creator Pro</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6">
        <h1 className="font-syne font-bold text-2xl text-ivory">AI Creative Assistant</h1>
        <p className="text-ivory-dim mt-1 text-sm">Powered by Claude — your African creative industry expert</p>
      </div>
      <div className="flex-1 bg-black-card border border-white/10 rounded-xl overflow-hidden">
        <CreatorAssistant creator={creator as Creator} />
      </div>
    </div>
  )
}

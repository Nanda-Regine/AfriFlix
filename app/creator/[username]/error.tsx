'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CreatorError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-5xl mb-6">🎨</p>
      <h2 className="font-syne font-bold text-2xl text-ivory mb-3">Couldn't load this creator</h2>
      <p className="text-ivory-dim max-w-sm mb-8">Something went wrong fetching their profile.</p>
      <div className="flex gap-3">
        <Button variant="gold" onClick={reset}>Try again</Button>
        <Link href="/explore"><Button variant="ghost">Browse creators</Button></Link>
      </div>
    </div>
  )
}

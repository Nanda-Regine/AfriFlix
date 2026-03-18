'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AfriFlix error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-5xl mb-6">🌍</p>
      <h2 className="font-syne font-bold text-2xl text-ivory mb-3">Something went wrong</h2>
      <p className="text-ivory-dim max-w-sm mb-8">
        We hit an unexpected error. This has been noted — please try again.
      </p>
      <Button variant="gold" onClick={reset}>Try again</Button>
    </div>
  )
}

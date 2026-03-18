'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl mb-4">⚡</p>
      <h2 className="font-syne font-bold text-xl text-ivory mb-3">Dashboard error</h2>
      <p className="text-ivory-dim text-sm mb-6">Something went wrong loading your dashboard data.</p>
      <Button variant="gold" onClick={reset}>Reload</Button>
    </div>
  )
}

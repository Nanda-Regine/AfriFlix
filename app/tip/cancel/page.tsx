import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TipCancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-md">
        <p className="text-6xl mb-6">🌍</p>
        <h1 className="font-syne font-bold text-3xl text-ivory mb-3">
          No worries
        </h1>
        <p className="text-ivory-dim mb-8 leading-relaxed">
          Your payment was cancelled. You can tip this creator any time — your
          support always makes a difference.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/explore">
            <Button variant="gold">Continue Browsing</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

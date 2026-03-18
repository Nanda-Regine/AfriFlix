import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TipSuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string }
}) {
  const ref = searchParams.ref

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-md">
        <p className="text-6xl mb-6">💛</p>
        <h1 className="font-syne font-bold text-3xl text-ivory mb-3">
          Tip sent!
        </h1>
        <p className="text-ivory-dim mb-2 leading-relaxed">
          Your support means the world to this creator. African creativity
          lives because of people like you.
        </p>
        {ref && (
          <p className="text-xs font-mono text-ivory-dim mb-8">
            Reference: {ref}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/explore">
            <Button variant="gold">Keep Exploring</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl mb-6">🌍</p>
      <h1 className="font-syne font-bold text-3xl text-ivory mb-3">You are offline</h1>
      <p className="text-ivory-dim max-w-sm mb-8">
        No connection detected. Some pages you have visited recently are still available.
        Reconnect to browse all of AfriFlix.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-gold text-black font-syne font-semibold rounded-pill hover:bg-gold-light transition-colors"
      >
        Try again
      </Link>
    </div>
  )
}

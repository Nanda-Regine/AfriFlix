import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Background */}
      <div className="absolute inset-0 kente-bg opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />

      {/* Logo */}
      <Link href="/" className="relative z-10 font-syne font-bold text-2xl mb-8">
        <span className="text-ivory">Afri</span>
        <span className="text-gold">Flix</span>
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-black-card border border-white/10 rounded-2xl p-8 shadow-card">
        {children}
      </div>

      <p className="relative z-10 mt-6 text-xs text-ivory-dim text-center">
        African Stories. Global Stage.
      </p>
    </div>
  )
}

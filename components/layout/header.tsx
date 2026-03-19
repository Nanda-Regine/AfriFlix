'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { NotificationsBell } from '@/components/layout/notifications-bell'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Browse' },
  { href: '/canvas', label: 'Canvas' },
  { href: '/live', label: '● Live', className: 'text-terra-light' },
  { href: '/collabs', label: 'Collabs' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, creator } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-black/95 backdrop-blur-md border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-syne font-bold text-xl leading-none">
            <span className="text-ivory">Afri</span>
            <span className="text-gold">Flix</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn('px-4 py-2 text-sm font-syne hover:text-ivory transition-colors rounded-lg hover:bg-white/5', link.className ?? 'text-ivory-mid')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                  placeholder="Search Afriflix..."
                  className="w-48 px-3 py-1.5 bg-black-card border border-gold/30 rounded-pill text-ivory text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold/60"
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="p-2 text-ivory-mid hover:text-ivory transition-colors"
              >
                <SearchIcon />
              </button>
            )}

            {user ? (
              <>
                <NotificationsBell />
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-9 h-9 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-sm font-syne font-semibold hover:bg-gold/30 transition-colors"
                  aria-label="Account"
                >
                  {creator?.display_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'A'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:block">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="gold" size="sm">Get Early Access</Button>
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-ivory-mid"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute right-0 top-0 bottom-0 w-72 bg-black-mid border-l border-white/10 flex flex-col p-6 gap-2 animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <span className="font-syne font-bold text-xl">
                <span className="text-ivory">Afri</span>
                <span className="text-gold">Flix</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-ivory-mid hover:text-ivory"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-ivory-mid hover:text-ivory font-syne hover:bg-black-hover rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-auto flex flex-col gap-3">
              {user ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full">Sign in</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button variant="gold" className="w-full">Get Early Access</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

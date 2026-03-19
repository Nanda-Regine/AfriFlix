import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/feed', label: 'My Feed', icon: '🌍' },
  { href: '/dashboard/works', label: 'My Works', icon: '🎬' },
  { href: '/dashboard/upload', label: 'Upload', icon: '⬆️' },
  { href: '/dashboard/collabs', label: 'Collabs', icon: '🤝' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { href: '/dashboard/earnings', label: 'Earnings', icon: '💰' },
  { href: '/dashboard/payouts', label: 'Payouts', icon: '🏦' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  return (
    <div className="min-h-screen pt-16 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-white/5 bg-black-mid p-4 gap-1 fixed top-16 bottom-0 left-0">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-mono text-ivory-dim uppercase tracking-wider">Creator Hub</p>
        </div>
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-syne text-ivory-mid hover:text-ivory hover:bg-black-hover transition-colors"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 z-30 bg-black-mid border-t border-white/5 flex overflow-x-auto">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-4 py-2 text-ivory-dim hover:text-ivory flex-shrink-0 transition-colors"
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[10px] font-syne">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 p-6">
        {children}
      </main>
    </div>
  )
}

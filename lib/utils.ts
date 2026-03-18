import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ContentCategory } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatCurrency(amount: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return `${minutes} min read`
}

export function categoryToSlug(category: ContentCategory): string {
  return category === 'visual_art' ? 'visual-art' : category
}

export function slugToCategory(slug: string): ContentCategory {
  return (slug === 'visual-art' ? 'visual_art' : slug) as ContentCategory
}

export function getPlayerType(category: ContentCategory): 'video' | 'audio' | 'text' | 'gallery' {
  if (['film', 'dance', 'comedy', 'theatre'].includes(category)) return 'video'
  if (category === 'music') return 'audio'
  if (category === 'writing') return 'text'
  if (category === 'visual_art') return 'gallery'
  // poetry can be either — check at runtime
  return 'video'
}

export function generateCardGradient(index: number): string {
  const gradients = [
    'from-amber-900/80 via-amber-800/40 to-transparent',
    'from-red-900/80 via-red-800/40 to-transparent',
    'from-emerald-900/80 via-emerald-800/40 to-transparent',
    'from-purple-900/80 via-purple-800/40 to-transparent',
    'from-blue-900/80 via-blue-800/40 to-transparent',
    'from-rose-900/80 via-rose-800/40 to-transparent',
    'from-teal-900/80 via-teal-800/40 to-transparent',
    'from-orange-900/80 via-orange-800/40 to-transparent',
  ]
  return gradients[index % gradients.length]
}

export function generateCardBg(index: number): string {
  const bgs = [
    'bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900',
    'bg-gradient-to-br from-rose-900 via-red-800 to-stone-900',
    'bg-gradient-to-br from-emerald-900 via-teal-800 to-stone-900',
    'bg-gradient-to-br from-purple-900 via-violet-800 to-stone-900',
    'bg-gradient-to-br from-sky-900 via-blue-800 to-stone-900',
    'bg-gradient-to-br from-orange-900 via-amber-800 to-stone-900',
    'bg-gradient-to-br from-green-900 via-emerald-800 to-stone-900',
    'bg-gradient-to-br from-indigo-900 via-purple-800 to-stone-900',
  ]
  return bgs[index % bgs.length]
}

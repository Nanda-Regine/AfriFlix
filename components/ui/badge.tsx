import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'terra' | 'dark' | 'trophy'
  className?: string
}

export function Badge({ children, variant = 'dark', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wider',
        {
          'bg-gold/20 text-gold border border-gold/30': variant === 'gold',
          'bg-terra/20 text-terra-light border border-terra/30': variant === 'terra',
          'bg-black-card text-ivory-mid border border-white/10': variant === 'dark',
          'bg-amber-500/20 text-amber-400 border border-amber-500/30': variant === 'trophy',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

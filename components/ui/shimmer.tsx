import { cn } from '@/lib/utils'

interface ShimmerProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Shimmer({ className, rounded = 'md' }: ShimmerProps) {
  return (
    <div
      className={cn(
        'bg-black-card relative overflow-hidden',
        {
          'rounded-sm': rounded === 'sm',
          'rounded-md': rounded === 'md',
          'rounded-lg': rounded === 'lg',
          'rounded-xl': rounded === 'xl',
          'rounded-full': rounded === 'full',
        },
        className
      )}
    >
      <div
        className="absolute inset-0 bg-shimmer-gradient animate-shimmer"
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  )
}

export function WorkCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 flex-shrink-0 w-48">
      <Shimmer className="w-full aspect-[2/3]" rounded="lg" />
      <Shimmer className="h-4 w-3/4" />
      <Shimmer className="h-3 w-1/2" />
    </div>
  )
}

export function CreatorCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-black-card rounded-xl">
      <Shimmer className="w-20 h-20" rounded="full" />
      <Shimmer className="h-4 w-24" />
      <Shimmer className="h-3 w-16" />
    </div>
  )
}

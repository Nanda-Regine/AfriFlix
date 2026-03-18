import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'terra' | 'ghost' | 'outline' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'gold', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-syne font-semibold rounded-pill transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-gold-gradient text-black hover:shadow-gold-strong hover:scale-[1.02] active:scale-[0.98]':
              variant === 'gold',
            'bg-terra-gradient text-ivory hover:shadow-terra hover:scale-[1.02] active:scale-[0.98]':
              variant === 'terra',
            'bg-transparent text-ivory-mid hover:text-ivory hover:bg-black-hover':
              variant === 'ghost',
            'border border-gold/40 text-gold bg-transparent hover:bg-gold/10 hover:border-gold/70':
              variant === 'outline',
            'bg-black-card text-ivory hover:bg-black-hover border border-white/5':
              variant === 'dark',
          },
          {
            'px-4 py-2 text-sm min-h-[36px]': size === 'sm',
            'px-6 py-3 text-base min-h-[44px]': size === 'md',
            'px-8 py-4 text-lg min-h-[52px]': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }

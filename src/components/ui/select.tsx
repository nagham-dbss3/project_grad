import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
}

/** Native select styled to match the design system (reliable, keyboard-accessible). */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, value, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        className={cn(
          'flex h-11 w-full appearance-none rounded-lg border border-input bg-background ps-3 pe-9 py-2 text-sm shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && placeholder ? 'text-muted-foreground' : '',
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  ),
)
Select.displayName = 'Select'

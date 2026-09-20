import { cn } from '../../utils/cn'

const sizes = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
}

export function LoadingSpinner({ size = 'md', label = 'Loading', className }) {
  return (
    <span role="status" className={cn('inline-flex items-center', className)}>
      <svg
        className={cn('animate-spin text-current', sizes[size])}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}

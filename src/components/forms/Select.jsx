import { useId } from 'react'
import { cn } from '../../utils/cn'
import { FormField } from './FormField'

/** Native <select>. `ref` is a regular prop (React 19), so it works with react-hook-form's `register`. */
export function Select({ label, hint, error, id, required, className, children, ref, ...props }) {
  const generatedId = useId()
  const selectId = id || generatedId

  return (
    <FormField id={selectId} label={label} hint={hint} error={error} required={required}>
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        className={cn(
          'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
          error ? 'border-red-500' : 'border-slate-300',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FormField>
  )
}

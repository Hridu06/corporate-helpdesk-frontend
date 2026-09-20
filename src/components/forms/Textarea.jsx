import { useId } from 'react'
import { cn } from '../../utils/cn'
import { FormField } from './FormField'

/** Multi-line text input. `ref` is a regular prop (React 19), so it works with react-hook-form's `register`. */
export function Textarea({ label, hint, error, id, required, className, rows = 3, ref, ...props }) {
  const generatedId = useId()
  const textareaId = id || generatedId

  return (
    <FormField id={textareaId} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        className={cn(
          'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
          'placeholder:text-slate-400',
          error ? 'border-red-500' : 'border-slate-300',
          className,
        )}
        {...props}
      />
    </FormField>
  )
}

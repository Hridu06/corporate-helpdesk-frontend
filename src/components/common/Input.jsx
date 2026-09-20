import { useId, useState } from 'react'
import { cn } from '../../utils/cn'
import { FormField } from '../forms/FormField'

function EyeIcon({ off }) {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  )
}

/**
 * Text input with label, hint and error support. `ref` is a regular prop
 * (React 19), so it works directly with react-hook-form's `register`.
 * Password inputs get a show/hide toggle.
 */
export function Input({ label, hint, error, type = 'text', className, id, required, ref, ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <FormField id={inputId} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
            'placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100',
            error ? 'border-red-500' : 'border-slate-300',
            isPassword && 'pr-10',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-slate-500 hover:text-slate-700"
          >
            <EyeIcon off={visible} />
          </button>
        )}
      </div>
    </FormField>
  )
}

import { useId } from 'react'

/** `ref` is a regular prop (React 19), so it works with react-hook-form's `register`. */
export function Checkbox({ label, id, ref, ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="size-4 rounded border-slate-300 text-brand-600"
        {...props}
      />
      <label htmlFor={inputId} className="text-sm text-slate-700">
        {label}
      </label>
    </div>
  )
}

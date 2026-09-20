import { useEffect, useId, useRef } from 'react'
import { cn } from '../../utils/cn'

/**
 * Accessible modal built on the native <dialog> element, which provides the
 * focus trap, Escape handling, inert background and focus restoration.
 */
export function Modal({ open, onClose, title, children, footer, className }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop targets the <dialog> itself.
        if (event.target === dialogRef.current) onClose()
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-white p-0 shadow-xl backdrop:bg-slate-900/50',
        className,
      )}
    >
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="-mr-2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">{footer}</div>}
    </dialog>
  )
}

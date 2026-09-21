import { useId, useRef, useState } from 'react'
import { Button } from '../../../components/common/Button'
import { ACCEPT_ATTRIBUTE, addFiles, formatFileSize } from '../attachments'
import { ATTACHMENT_LIMITS } from '../constants'

/**
 * Choose files to attach. The checks here (type, size, count) are only there to
 * warn early; the server re-checks every file by its content.
 */
export function AttachmentPicker({ files, onChange, disabled = false }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [problems, setProblems] = useState([])

  const handleChosen = (event) => {
    const { files: next, problems: rejected } = addFiles(files, Array.from(event.target.files ?? []))
    setProblems(rejected)
    onChange(next)
    event.target.value = '' // lets the same file be chosen again after removing it
  }

  const remove = (index) => {
    setProblems([])
    onChange(files.filter((_, position) => position !== index))
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        hidden
        accept={ACCEPT_ATTRIBUTE}
        disabled={disabled}
        aria-label="Attach files"
        onChange={handleChosen}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={disabled || files.length >= ATTACHMENT_LIMITS.maxFiles} onClick={() => inputRef.current?.click()}>
          Attach files
        </Button>
        <span className="text-xs text-slate-500">
          Up to {ATTACHMENT_LIMITS.maxFiles} files, {formatFileSize(ATTACHMENT_LIMITS.maxFileBytes)} each. Images, PDF, text, CSV, Word, Excel.
        </span>
      </div>

      {problems.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-red-700">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul aria-label="Selected files" className="divide-y divide-slate-200 rounded-md border border-slate-200 text-sm">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0 break-words text-slate-800">
                {file.name} <span className="text-slate-500">({formatFileSize(file.size)})</span>
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(index)}
                className="shrink-0 font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Remove{' '}
                <span className="sr-only">{file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

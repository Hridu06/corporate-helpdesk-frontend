import { ATTACHMENT_LIMITS } from './constants'

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ACCEPT_ATTRIBUTE = ATTACHMENT_LIMITS.extensions.map((extension) => `.${extension}`).join(',')

const extensionOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

/**
 * Add newly chosen files to the current selection. Returns the new selection and a
 * message for each file that was left out. This is a convenience only; the server
 * re-checks everything by content.
 */
export function addFiles(current, incoming) {
  const { maxFiles, maxFileBytes, maxTotalBytes, extensions } = ATTACHMENT_LIMITS
  const files = [...current]
  const problems = []
  let total = files.reduce((sum, file) => sum + file.size, 0)

  for (const file of incoming) {
    if (!extensions.includes(extensionOf(file.name))) {
      problems.push(`${file.name}: this file type is not allowed. Allowed: ${extensions.join(', ')}.`)
    } else if (file.size === 0) {
      problems.push(`${file.name}: the file is empty.`)
    } else if (file.size > maxFileBytes) {
      problems.push(`${file.name}: larger than ${formatFileSize(maxFileBytes)}.`)
    } else if (files.length >= maxFiles) {
      problems.push(`${file.name}: you can attach up to ${maxFiles} files.`)
    } else if (total + file.size > maxTotalBytes) {
      problems.push(`${file.name}: the files together would be larger than ${formatFileSize(maxTotalBytes)}.`)
    } else if (files.some((existing) => existing.name === file.name && existing.size === file.size)) {
      problems.push(`${file.name}: already added.`)
    } else {
      files.push(file)
      total += file.size
    }
  }

  return { files, problems }
}

/** Turn a failed API call into readable lines: the server's per-file messages when it gave them. */
export function uploadErrorMessages(error) {
  if (error.status === 413 || error.code === 'payload_too_large') return ['The upload is too large. Attach fewer or smaller files.']
  if (error.status === 429) return ['You have uploaded too many files recently. Please try again later.']

  const perFile = Object.entries(error.errors ?? {})
    .filter(([field]) => field.startsWith('attachments'))
    .flatMap(([, messages]) => messages)

  return perFile.length > 0 ? perFile : [error.message]
}

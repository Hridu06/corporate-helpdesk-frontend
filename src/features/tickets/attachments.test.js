import { describe, expect, it } from 'vitest'
import { addFiles, formatFileSize, uploadErrorMessages } from './attachments'

const file = (name, size = 100) => ({ name, size })

describe('formatFileSize', () => {
  it.each([
    [500, '500 B'],
    [2048, '2 KB'],
    [5 * 1024 * 1024, '5.0 MB'],
  ])('%i bytes reads %s', (bytes, text) => expect(formatFileSize(bytes)).toBe(text))
})

describe('addFiles', () => {
  it('adds allowed files, judging the extension case-insensitively', () => {
    const { files, problems } = addFiles([], [file('Shot.PNG'), file('notes.txt')])
    expect(files.map((f) => f.name)).toEqual(['Shot.PNG', 'notes.txt'])
    expect(problems).toEqual([])
  })

  it.each(['run.exe', 'page.html', 'icon.svg', 'macro.docm', 'archive.zip', 'noextension', 'evil.php.exe'])('leaves out %s', (name) => {
    const { files, problems } = addFiles([], [file(name)])
    expect(files).toEqual([])
    expect(problems[0]).toContain('not allowed')
  })

  it('leaves out empty and oversize files', () => {
    const { files, problems } = addFiles([], [file('a.txt', 0), file('b.txt', 5 * 1024 * 1024 + 1)])
    expect(files).toEqual([])
    expect(problems).toEqual(['a.txt: the file is empty.', 'b.txt: larger than 5.0 MB.'])
  })

  it('stops at five files', () => {
    const current = ['1', '2', '3', '4', '5'].map((n) => file(`${n}.txt`))
    const { files, problems } = addFiles(current, [file('6.txt')])
    expect(files).toHaveLength(5)
    expect(problems[0]).toContain('up to 5 files')
  })

  it('keeps the total under 15 MB', () => {
    const big = 4 * 1024 * 1024
    const { files, problems } = addFiles([file('a.txt', big), file('b.txt', big), file('c.txt', big)], [file('d.txt', big)])
    expect(files).toHaveLength(3)
    expect(problems[0]).toContain('together')
  })

  it('ignores a file that was already added', () => {
    const { files, problems } = addFiles([file('a.txt', 10)], [file('a.txt', 10)])
    expect(files).toHaveLength(1)
    expect(problems).toEqual(['a.txt: already added.'])
  })
})

describe('uploadErrorMessages', () => {
  it('uses the per-file messages the server gave', () => {
    const error = { status: 422, message: 'x', errors: { 'attachments.1': ['b.png: The file content does not match.'], body: ['no'] } }
    expect(uploadErrorMessages(error)).toEqual(['b.png: The file content does not match.'])
  })

  it('explains too-large and rate-limited uploads', () => {
    expect(uploadErrorMessages({ status: 413, code: 'payload_too_large', message: 'x' })[0]).toContain('too large')
    expect(uploadErrorMessages({ status: 429, message: 'x' })[0]).toContain('too many')
  })

  it('falls back to the error message', () => {
    expect(uploadErrorMessages({ status: 500, message: 'Server error', errors: {} })).toEqual(['Server error'])
  })
})

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement the modal <dialog> API used by <Modal>.
HTMLDialogElement.prototype.showModal ??= function showModal() {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function close() {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

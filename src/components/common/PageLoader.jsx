import { LoadingSpinner } from './LoadingSpinner'

/** Suspense fallback shown while a lazily loaded page downloads. */
export function PageLoader() {
  return (
    <div className="flex justify-center py-12 text-brand-600">
      <LoadingSpinner size="lg" label="Loading page" />
    </div>
  )
}

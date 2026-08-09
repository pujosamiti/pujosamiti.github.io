import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Without this, a single throw anywhere in the tree unmounts everything and
 * the member is left staring at a white page — nothing to read, nothing to
 * report, and the Worker logs show only healthy 200s because the failure is
 * entirely in the browser. Catch it and say so instead.
 *
 * Deliberately plain markup: the boundary must not depend on the same UI
 * components that may have just thrown.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[pujosamiti] render failed', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-bold">এই পাতাটি খুলল না</h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong while drawing this page. Reloading usually fixes it — the samiti's
          data is safe.
        </p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
          <a
            href="/"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Home
          </a>
        </div>
        <details className="mt-2 text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Details (helpful if you report this)
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-left text-[11px]">
            {error.message}
          </pre>
        </details>
      </div>
    )
  }
}

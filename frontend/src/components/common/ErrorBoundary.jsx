import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * ErrorBoundary — catches render errors in child components and shows
 * a recovery UI instead of a white screen.  Sidebar & TopNav stay alive.
 *
 * Props:
 *   resetKey – when this changes (e.g. location.pathname), the boundary
 *              auto-clears so navigating away from a broken page recovers.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught:', error, info.componentStack)
  }

  componentDidUpdate(prevProps) {
    // Auto-reset when the user navigates to a different page
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="glass-card max-w-lg w-full p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This module encountered an unexpected error. The rest of the
              dashboard is unaffected — use the sidebar to navigate away, or
              retry below.
            </p>
          </div>

          {/* Error detail (collapsed by default) */}
          {this.state.error && (
            <details className="text-left bg-navy-950/60 border border-white/5 rounded-xl p-4">
              <summary className="text-xs font-medium text-slate-500 cursor-pointer select-none">
                Technical details
              </summary>
              <pre className="mt-3 text-xs text-red-300/80 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          {/* Retry button */}
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan
                       text-sm font-medium transition-all duration-200
                       hover:bg-accent-cyan/20 hover:border-accent-cyan/40 hover:shadow-glow"
          >
            <RefreshCw className="w-4 h-4" />
            Retry this module
          </button>
        </div>
      </div>
    )
  }
}

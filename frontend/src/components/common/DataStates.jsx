import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function LoadingState({ message = 'Loading intelligence data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 text-center max-w-md mx-auto mt-12"
    >
      <AlertCircle className="w-10 h-10 text-accent-red mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">Failed to load data</h3>
      <p className="text-sm text-slate-400 mb-6">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Retry
        </button>
      )}
    </motion.div>
  )
}

export function useFetchData(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, reload: load }
}

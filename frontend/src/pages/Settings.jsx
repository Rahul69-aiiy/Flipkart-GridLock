import { motion } from 'framer-motion'
import { Settings, Server, Database } from 'lucide-react'
import useStore from '@/store/useStore'
import { useFetchData } from '@/components/common/DataStates'
import { fetchSummary } from '@/api/client'
import { formatNumber, formatDateRange } from '@/lib/utils'

export default function SettingsPage() {
  const { apiHealthy } = useStore()
  const { data: summary, loading } = useFetchData(fetchSummary)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* API Connection */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold text-white">Platform Settings</h3>
        </div>

        <div className="p-4 rounded-xl bg-navy-800/50 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-accent-cyan" />
            <span className="text-sm font-medium text-white">API Connection</span>
          </div>
          <p className="text-sm text-slate-400">
            Backend: <code className="text-accent-cyan">http://localhost:8000</code>
          </p>
          <p className={`text-sm mt-1 font-medium ${apiHealthy ? 'text-accent-green' : apiHealthy === false ? 'text-accent-red' : 'text-slate-500'}`}>
            Status: {apiHealthy ? '● Connected' : apiHealthy === false ? '● Offline — run: uvicorn app:app --reload' : '○ Checking...'}
          </p>
        </div>
      </motion.div>

      {/* Dataset Info from backend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-accent-purple" />
          <h3 className="text-lg font-semibold text-white">Dataset Information</h3>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading dataset info...</p>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Total Records', value: formatNumber(summary.total_records) },
              { label: 'Original Records', value: formatNumber(summary.original_records) },
              { label: 'Filtered Out', value: formatNumber(summary.filtered_records) },
              { label: 'Total Junctions', value: formatNumber(summary.total_junctions) },
              { label: 'Police Stations', value: formatNumber(summary.total_police_stations) },
              { label: 'Total Columns', value: summary.total_columns },
              { label: 'Vehicle Types', value: Object.keys(summary.vehicle_types || {}).length },
              { label: 'Violation Types', value: Object.keys(summary.violation_types || {}).length },
              { label: 'Date Range', value: formatDateRange(summary.date_range?.start, summary.date_range?.end) },
              { label: 'Junction Records', value: formatNumber(summary.total_junction_records) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between p-3 rounded-xl bg-navy-800/50">
                <span className="text-sm text-slate-400">{row.label}</span>
                <span className="text-sm font-medium text-white">{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-accent-red">Could not load dataset info — check API connection.</p>
        )}
      </motion.div>

      {/* Data quality issues */}
      {summary?.data_quality?.issues?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Data Quality Notes</h3>
          <div className="space-y-2">
            {summary.data_quality.issues.map((issue, i) => (
              <div key={i} className="p-3 rounded-xl bg-navy-800/50 border border-accent-orange/20">
                <p className="text-sm text-slate-300 leading-relaxed">{issue}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

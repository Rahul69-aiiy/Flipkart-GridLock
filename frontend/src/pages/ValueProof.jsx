import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, Zap, Target, Award } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import { fetchValueProof } from '@/api/client'
import { formatNumber } from '@/lib/utils'

const TOOLTIP_STYLE = {
  backgroundColor: '#0B1526',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
}

export default function ValueProof() {
  const { data, loading, error, reload } = useFetchData(fetchValueProof)

  if (loading) return <LoadingState message="Computing value proof analytics..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const comparison = data.comparison || []
  const summary = data.summary || {}

  // All KPI values come directly from backend
  const avgImprovement = summary.avg_improvement_pct ?? 0
  const maxImprovement = summary.max_improvement_pct ?? 0
  const bestSize = summary.best_deployment_size ?? 0

  // Best entry = the deployment_size that achieved max improvement
  const bestEntry = comparison.find((c) => c.deployment_size === bestSize) || comparison[comparison.length - 1] || {}

  // Bar chart — direct backend fields
  const barData = comparison.map((c) => ({
    size: `K=${c.deployment_size}`,
    deployment_size: c.deployment_size,
    naive: parseFloat(c.naive_coverage_pct.toFixed(2)),
    optimized: parseFloat(c.optimized_coverage_pct.toFixed(2)),
    improvement: parseFloat(c.improvement_pct.toFixed(2)),
  }))

  // Line chart — coverage curves directly from backend
  const lineData = comparison.map((c) => ({
    size: c.deployment_size,
    'Traditional': parseFloat(c.naive_coverage_pct.toFixed(2)),
    'AI Optimized': parseFloat(c.optimized_coverage_pct.toFixed(2)),
  }))

  return (
    <div className="space-y-6">
      {/* KPIs — all from backend summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Avg Coverage Improvement"
          value={avgImprovement}
          icon={TrendingUp}
          color="green"
          decimals={2}
          isPercent
          subtitle="AI vs naive avg"
        />
        <KPICard
          title="Max Coverage Improvement"
          value={maxImprovement}
          icon={Zap}
          color="cyan"
          decimals={2}
          isPercent
          subtitle={`At K=${bestSize}`}
        />
        <KPICard
          title="Best Deployment Size"
          value={bestSize}
          icon={Target}
          color="purple"
          subtitle="Optimal junctions"
        />
        <KPICard
          title="AI Coverage at Best K"
          value={bestEntry.optimized_coverage_pct ?? 0}
          icon={Award}
          color="orange"
          decimals={2}
          isPercent
          subtitle={`vs ${formatNumber(bestEntry.naive_coverage_pct ?? 0, 2)}% naive`}
        />
      </div>

      {/* Main comparison bar chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Traditional vs AI Optimized — Coverage %</h3>
        <p className="text-xs text-slate-500 mb-4">CIP coverage percentage captured by each strategy at each deployment size K</p>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={barData} margin={{ bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="size" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v, name) => [`${v.toFixed(2)}%`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            <Bar dataKey="naive" fill="#475569" name="Traditional" radius={[4, 4, 0, 0]} />
            <Bar dataKey="optimized" fill="#00D4FF" name="AI Optimized" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Improvement % + coverage curves side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Improvement per Deployment Size</h3>
          <p className="text-xs text-slate-500 mb-4">
            Extra coverage % gained by AI optimized vs traditional
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="size" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [`${v.toFixed(2)}%`, 'Improvement']}
              />
              <ReferenceLine y={avgImprovement} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: `Avg ${avgImprovement.toFixed(1)}%`, fill: '#F59E0B', fontSize: 10 }} />
              <Bar dataKey="improvement" name="Improvement %" radius={[4, 4, 0, 0]} fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Coverage Curves</h3>
          <p className="text-xs text-slate-500 mb-4">Cumulative coverage as deployment size increases</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="size" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'K (junctions)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v.toFixed(2)}%`]} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="Traditional" stroke="#475569" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="AI Optimized" stroke="#00D4FF" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Per-row breakdown table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Full Comparison Table</h3>
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="data-table">
            <thead>
              <tr className="bg-navy-800/50">
                <th>Deployment Size (K)</th>
                <th>Traditional Coverage</th>
                <th>AI Optimized Coverage</th>
                <th>Improvement</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.deployment_size} className={c.deployment_size === bestSize ? 'bg-accent-green/5' : ''}>
                  <td className={`font-bold ${c.deployment_size === bestSize ? 'text-accent-green' : 'text-white'}`}>
                    K={c.deployment_size}
                    {c.deployment_size === bestSize && <span className="ml-2 badge-green">Best</span>}
                  </td>
                  <td className="text-slate-400">{c.naive_coverage_pct.toFixed(2)}%</td>
                  <td className="text-accent-cyan font-medium">{c.optimized_coverage_pct.toFixed(2)}%</td>
                  <td>
                    <span className={`font-bold ${c.improvement_pct > 0 ? 'text-accent-green' : 'text-slate-500'}`}>
                      {c.improvement_pct > 0 ? '+' : ''}{c.improvement_pct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Methodology from backend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Methodology</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{data.methodology}</p>
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-navy-800/50 text-center">
            <p className="text-2xl font-bold text-accent-cyan">{avgImprovement.toFixed(2)}%</p>
            <p className="text-xs text-slate-500 mt-1">Avg Improvement</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-800/50 text-center">
            <p className="text-2xl font-bold text-accent-green">{maxImprovement.toFixed(2)}%</p>
            <p className="text-xs text-slate-500 mt-1">Max Improvement</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-800/50 text-center">
            <p className="text-2xl font-bold text-accent-purple">K={bestSize}</p>
            <p className="text-xs text-slate-500 mt-1">Optimal Size</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

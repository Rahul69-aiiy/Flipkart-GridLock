import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  AreaChart,
  Area,
} from 'recharts'
import { PieChart, Target, TrendingDown, Zap } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import { fetchCoverage } from '@/api/client'
import { formatNumber } from '@/lib/utils'

const chartTooltipStyle = {
  backgroundColor: '#0B1526',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
}

export default function CoverageAnalysis() {
  const { data, loading, error, reload } = useFetchData(fetchCoverage)

  if (loading) return <LoadingState message="Analyzing coverage curves..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const curve = data.curve || []
  const kneePoint = data.knee_point
  const kneeEntry = curve.find((c) => c.officer_hours === kneePoint) || curve[Math.floor(curve.length / 2)]

  const marginalData = curve.map((c, i) => {
    const prev = i > 0 ? curve[i - 1] : { coverage_pct: 0, officer_hours: 0 }
    const marginal = i > 0 ? c.coverage_pct - prev.coverage_pct : c.coverage_pct
    const hoursDelta = i > 0 ? c.officer_hours - prev.officer_hours : c.officer_hours
    return {
      hours: c.officer_hours,
      coverage: c.coverage_pct,
      marginal: hoursDelta > 0 ? marginal / hoursDelta : marginal,
      junction: c.junction_added,
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Junctions" value={data.total_junctions} icon={PieChart} color="blue" />
        <KPICard title="Knee Point" value={kneePoint} icon={Target} color="cyan" subtitle={`${kneeEntry?.coverage_pct?.toFixed(1) || 0}% coverage`} />
        <KPICard title="Full Coverage Hours" value={data.full_coverage_hours} icon={Zap} color="purple" subtitle="100% coverage" />
        <KPICard title="Marginal Gain at Knee" value={data.marginal_gain_at_knee} icon={TrendingDown} color="orange" decimals={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Coverage vs Officer Hours</h3>
          <p className="text-xs text-slate-500 mb-4">
            Optimal point: {kneePoint} hrs → {kneeEntry?.coverage_pct?.toFixed(1)}% coverage
          </p>
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={curve}>
              <defs>
                <linearGradient id="covGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="officer_hours" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Officer Hours', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v, name) => [typeof v === 'number' ? v.toFixed(1) + '%' : v, name]}
                labelFormatter={(h) => `${h} officer hours`}
              />
              <Area type="monotone" dataKey="coverage_pct" stroke="#00D4FF" fill="url(#covGrad)" strokeWidth={2} name="Coverage %" />
              {kneeEntry && (
                <ReferenceDot
                  x={kneePoint}
                  y={kneeEntry.coverage_pct}
                  r={8}
                  fill="#10B981"
                  stroke="#07111F"
                  strokeWidth={2}
                  label={{ value: 'Optimal', position: 'top', fill: '#10B981', fontSize: 11 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">AI Recommended Staffing</h3>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent-green/10 to-accent-cyan/10 border border-accent-green/20 mb-6">
            <p className="text-4xl font-bold text-accent-green">{data.recommended_staffing?.officer_hours}</p>
            <p className="text-sm text-slate-400 mt-1">officer hours</p>
            <p className="text-2xl font-bold text-white mt-4">{data.recommended_staffing?.coverage_pct?.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">recommended coverage</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm p-3 rounded-xl bg-navy-800/50">
              <span className="text-slate-400">Knee Point</span>
              <span className="text-accent-cyan font-medium">{kneePoint} hrs</span>
            </div>
            <div className="flex justify-between text-sm p-3 rounded-xl bg-navy-800/50">
              <span className="text-slate-400">Coverage at Knee</span>
              <span className="text-white font-medium">{kneeEntry?.coverage_pct?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm p-3 rounded-xl bg-navy-800/50">
              <span className="text-slate-400">Last Junction Added</span>
              <span className="text-white font-medium text-xs truncate max-w-[140px]">{kneeEntry?.junction_added || '—'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Marginal Gains (Diminishing Returns)</h3>
        <p className="text-xs text-slate-500 mb-4">Additional coverage % per officer hour added</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={marginalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hours" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(v) => [v?.toFixed(3) + '%/hr', 'Marginal Gain']}
            />
            <Line type="monotone" dataKey="marginal" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} name="Marginal Gain" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Coverage Curve Details</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-navy-800/50">
                <th>Officer Hours</th>
                <th>Coverage %</th>
                <th>Junction Added</th>
                <th>Junction Hours</th>
              </tr>
            </thead>
            <tbody>
              {curve.slice(0, 20).map((c, i) => (
                <tr key={i} className={c.officer_hours === kneePoint ? 'bg-accent-green/5' : ''}>
                  <td className={c.officer_hours === kneePoint ? 'text-accent-green font-bold' : ''}>{c.officer_hours}</td>
                  <td>{c.coverage_pct?.toFixed(1)}%</td>
                  <td className="max-w-xs truncate">{c.junction_added}</td>
                  <td>{c.junction_hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

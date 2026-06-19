import { motion } from 'framer-motion'
import { Shield, CheckCircle, Database, AlertTriangle } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import DataTable from '@/components/common/DataTable'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import { fetchConfidence } from '@/api/client'
import { formatNumber, getConfidenceLevel } from '@/lib/utils'

function ReliabilityGauge({ score, size = 120 }) {
  const level = getConfidenceLevel(score)
  const pct = (score || 0) * 100
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#101C2F" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={level.color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${level.color}80)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-white">{(score * 100).toFixed(0)}%</span>
        <span className="text-xs text-slate-500">{level.label}</span>
      </div>
    </div>
  )
}

export default function ConfidenceEngine() {
  const { data, loading, error, reload } = useFetchData(fetchConfidence)

  if (loading) return <LoadingState message="Computing confidence scores..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const scores = data.scores || []
  const avgConfidence = scores.length
    ? scores.reduce((s, c) => s + c.confidence_score, 0) / scores.length
    : 0
  const highConf = scores.filter((s) => s.confidence_score >= 0.8).length
  const lowConf = scores.filter((s) => s.confidence_score < 0.4).length
  const topScore = scores[0]

  const columns = [
    { key: 'rank', label: 'Rank', render: (r) => <span className="text-accent-cyan font-bold">#{r.rank}</span> },
    { key: 'junction_name', label: 'Junction' },
    {
      key: 'confidence_score',
      label: 'Confidence',
      render: (r) => {
        const level = getConfidenceLevel(r.confidence_score)
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${r.confidence_score * 100}%`, background: level.color }} />
            </div>
            <span className="font-medium" style={{ color: level.color }}>{(r.confidence_score * 100).toFixed(1)}%</span>
          </div>
        )
      },
    },
    { key: 'temporal_consistency', label: 'Temporal', render: (r) => formatNumber(r.temporal_consistency * 100, 1) + '%' },
    { key: 'data_density', label: 'Density', render: (r) => formatNumber(r.data_density * 100, 1) + '%' },
    { key: 'historical_depth', label: 'Depth', render: (r) => formatNumber(r.historical_depth * 100, 1) + '%' },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs — all from backend scores array */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Junctions" value={data.total_junctions} icon={Database} color="blue" />
        <KPICard title="Avg Confidence" value={avgConfidence * 100} icon={Shield} color="cyan" decimals={1} isPercent />
        <KPICard title="High Reliability" value={highConf} icon={CheckCircle} color="green" subtitle="Score ≥ 80%" />
        <KPICard title="Low Reliability" value={lowConf} icon={AlertTriangle} color="red" subtitle="Score < 40%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall gauge */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-white mb-6 self-start">Overall Reliability</h3>
          <ReliabilityGauge score={avgConfidence} size={160} />
          <p className="text-xs text-slate-500 mt-6 text-center max-w-xs">{data.method}</p>
        </motion.div>

        {/* Top junction breakdown */}
        {topScore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Top Confidence Junction</h3>
            <p className="text-base font-bold text-accent-cyan mb-4">{topScore.junction_name}</p>
            <div className="flex justify-center mb-5">
              <ReliabilityGauge score={topScore.confidence_score} size={140} />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Temporal Consistency', value: topScore.temporal_consistency },
                { label: 'Data Density', value: topScore.data_density },
                { label: 'Historical Depth', value: topScore.historical_depth },
              ].map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{c.label}</span>
                    <span className="text-white">{(c.value * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-navy-800 rounded-full">
                    <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${c.value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Components from backend + score distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Scoring Components</h3>
          <div className="space-y-3 mb-6">
            {(data.components || []).map((comp, i) => (
              <div key={i} className="p-3 rounded-xl bg-navy-800/50 border border-white/5">
                <p className="text-sm text-slate-300">{comp}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'High', color: '#10B981', count: scores.filter((s) => s.confidence_score >= 0.8).length },
              { label: 'Medium', color: '#F59E0B', count: scores.filter((s) => s.confidence_score >= 0.4 && s.confidence_score < 0.8).length },
              { label: 'Low', color: '#EF4444', count: scores.filter((s) => s.confidence_score < 0.4).length },
            ].map((b) => (
              <div key={b.label} className="p-3 rounded-xl bg-navy-800/30">
                <p className="text-2xl font-bold" style={{ color: b.color }}>{b.count}</p>
                <p className="text-xs text-slate-500">{b.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Confidence Rankings</h3>
        <DataTable columns={columns} data={scores} searchPlaceholder="Search junctions..." pageSize={20} />
      </motion.div>
    </div>
  )
}

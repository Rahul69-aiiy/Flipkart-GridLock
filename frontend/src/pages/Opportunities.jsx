import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Shield, Clock, Zap } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import DataTable from '@/components/common/DataTable'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import { fetchOpportunities } from '@/api/client'
import { formatNumber, formatHourWindow } from '@/lib/utils'
import useStore from '@/store/useStore'

export default function Opportunities() {
  const setTopOpportunity = useStore((s) => s.setTopOpportunity)
  const { data, loading, error, reload } = useFetchData(() => fetchOpportunities(50))

  useEffect(() => {
    if (data?.opportunities?.[0]) setTopOpportunity(data.opportunities[0])
  }, [data, setTopOpportunity])

  if (loading) return <LoadingState message="Discovering opportunities..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const opps = data.opportunities || []
  const top = opps[0]
  const totalScore = opps.reduce((s, o) => s + o.opportunity_score, 0)

  const columns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (r) => (
        <span className={`font-bold ${r.rank <= 3 ? 'text-accent-cyan' : ''}`}>#{r.rank}</span>
      ),
    },
    { key: 'junction_name', label: 'Junction' },
    {
      key: 'opportunity_score',
      label: 'Opportunity Score',
      render: (r) => <span className="font-bold text-accent-green">{formatNumber(r.opportunity_score, 2)}</span>,
    },
    {
      key: 'predicted_cip',
      label: 'Predicted CIP',
      render: (r) => <span className="text-accent-purple">{formatNumber(r.predicted_cip, 1)}</span>,
    },
    {
      key: 'confidence_score',
      label: 'Confidence',
      render: (r) => (
        <span className={r.confidence_score >= 0.8 ? 'text-accent-green' : r.confidence_score >= 0.6 ? 'text-accent-orange' : 'text-accent-red'}>
          {(r.confidence_score * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'required_officer_hours',
      label: 'Officer Hours',
      render: (r) => `${r.required_officer_hours}h`,
    },
    {
      key: 'peak_window',
      label: 'Peak Window',
      render: (r) => (
        <span className="badge-blue">
          {formatHourWindow(r.peak_window_start, r.peak_window_end)}
        </span>
      ),
    },
    { key: 'police_station', label: 'Station' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Top Opportunity"
          value={top?.opportunity_score || 0}
          icon={Target}
          color="green"
          decimals={2}
          subtitle={top?.junction_name}
        />
        <KPICard title="Total Opportunities" value={data.total_junctions} icon={Zap} color="cyan" />
        <KPICard title="Aggregate Score" value={totalScore} icon={TrendingUp} color="purple" decimals={0} />
        <KPICard title="Avg Confidence" value={opps.length ? (opps.reduce((s, o) => s + o.confidence_score, 0) / opps.length) * 100 : 0} icon={Shield} color="blue" decimals={1} isPercent />
        <KPICard title="Avg Officer Hours" value={opps.length ? opps.reduce((s, o) => s + o.required_officer_hours, 0) / opps.length : 0} icon={Clock} color="orange" decimals={1} />
      </div>

      {top && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 bg-gradient-to-r from-accent-green/5 to-accent-cyan/5 border-accent-green/20"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-accent-green uppercase tracking-wider font-semibold mb-1">AI Recommended Priority</p>
              <h3 className="text-xl font-bold text-white">{top.junction_name}</h3>
              <p className="text-sm text-slate-400 mt-1">{top.police_station} · Peak: {formatHourWindow(top.peak_window_start, top.peak_window_end)}</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-green">{formatNumber(top.opportunity_score, 2)}</p>
                <p className="text-xs text-slate-500">Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-purple">{formatNumber(top.predicted_cip, 1)}</p>
                <p className="text-xs text-slate-500">Predicted CIP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-cyan">{(top.confidence_score * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-500">Confidence</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Opportunity Rankings</h3>
            <p className="text-xs text-slate-500">{data.formula}</p>
          </div>
        </div>
        <DataTable columns={columns} data={opps} searchPlaceholder="Search junctions, stations..." />
      </motion.div>
    </div>
  )
}

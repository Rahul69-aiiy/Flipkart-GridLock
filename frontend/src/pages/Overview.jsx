import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, Filter, MapPin, Target, TrendingUp, Building2 } from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import KPICard from '@/components/common/KPICard'
import HotspotMap from '@/components/maps/HotspotMap'
import { ErrorState } from '@/components/common/DataStates'
import { fetchSummary, fetchHotspots, fetchOpportunities } from '@/api/client'
import { formatNumber, formatDateRange } from '@/lib/utils'
import useStore from '@/store/useStore'
import GlassTooltip from '@/components/common/GlassTooltip'

// Lightweight skeleton while a section is loading
function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg bg-navy-800/60 animate-pulse ${className}`}
      style={{ minHeight: 20, ...style }}
    />
  )
}

function KPISkeleton() {
  return (
    <div className="glass-card p-4 space-y-2">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-2 w-3/4" />
    </div>
  )
}

export default function Overview() {
  const setTopOpportunity = useStore((s) => s.setTopOpportunity)
  const searchQuery = useStore((s) => s.searchQuery)

  const [summary, setSummary] = useState(null)
  const [hotspots, setHotspots] = useState(null)
  const [opportunities, setOpportunities] = useState(null)
  const [error, setError] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [mapsLoading, setMapsLoading] = useState(true)

  useEffect(() => {
    // Fetch summary and hotspots+opportunities in parallel
    // Summary resolves independently so KPIs render as soon as it's ready
    fetchSummary()
      .then((data) => { setSummary(data); setSummaryLoading(false) })
      .catch((err) => { setError(err.message); setSummaryLoading(false) })

    Promise.all([fetchHotspots(100), fetchOpportunities(1)])
      .then(([hs, opp]) => {
        setHotspots(hs)
        setOpportunities(opp)
        if (opp?.opportunities?.[0]) setTopOpportunity(opp.opportunities[0])
        setMapsLoading(false)
      })
      .catch(() => setMapsLoading(false))
  }, [setTopOpportunity])

  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />

  // Temporal distribution — month numbers from backend (1=Jan, etc.)
  const monthNames = { '1':'Jan','2':'Feb','3':'Mar','4':'Apr','5':'May','6':'Jun','7':'Jul','8':'Aug','9':'Sep','10':'Oct','11':'Nov','12':'Dec' }
  const temporalData = summary
    ? Object.entries(summary.temporal_distribution || {})
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([month, count]) => ({ month: monthNames[month] || `M${month}`, violations: count }))
    : []

  // Data quality bars
  const totalMissingCols = summary ? Object.keys(summary.missing_values || {}).length : 0
  const totalCols = summary?.total_columns || 1
  const completePct = summary ? ((totalCols - totalMissingCols) / totalCols) * 100 : 0
  const junctionPct = summary ? (summary.total_junction_records / (summary.total_records || 1)) * 100 : 0

  const qualityBars = summary ? [
    { label: 'Data Completeness', value: completePct, color: '#10B981', note: `${totalMissingCols} of ${totalCols} columns have missing values` },
    { label: 'Junction Coverage', value: junctionPct, color: '#00D4FF', note: `${formatNumber(summary.total_junction_records)} records have named junctions` },
    { label: 'Record Validity', value: ((summary.total_records / (summary.original_records || 1)) * 100), color: '#8B5CF6', note: `${formatNumber(summary.filtered_records)} records filtered out` },
  ] : []

  // Vehicle type chart
  const vehicleData = summary
    ? Object.entries(summary.vehicle_types || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count }))
    : []

  const topOppScore = opportunities?.opportunities?.[0]?.opportunity_score ?? null
  const filteredHotspots = (hotspots?.hotspots || []).filter((m) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      m.junction_name?.toLowerCase().includes(q) ||
      m.police_station?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          <>
            <KPICard title="Total Records" value={summary.total_records} icon={Database} color="cyan" subtitle="After quality filter" />
            <KPICard title="Original Records" value={summary.original_records} icon={Database} color="blue" subtitle="Pre-filter dataset" />
            <KPICard title="Filtered Out" value={summary.filtered_records} icon={Filter} color="orange" subtitle="Rejected / duplicates" />
            <KPICard title="Total Junctions" value={summary.total_junctions} icon={MapPin} color="purple" />
            <KPICard title="Police Stations" value={summary.total_police_stations} icon={Building2} color="teal" />
            {topOppScore != null
              ? <KPICard title="Top Opp Score" value={topOppScore} icon={Target} color="green" decimals={2} subtitle={opportunities?.opportunities?.[0]?.junction_name} />
              : <KPICard title="Violation Types" value={Object.keys(summary.violation_types || {}).length} icon={TrendingUp} color="green" subtitle="Unique categories" />
            }
          </>
        )}
      </div>

      {/* Map + Data Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Parking Violation Hotspots</h3>
              <p className="text-xs text-slate-500">Real-time GIS intelligence layer</p>
            </div>
            <span className="badge-blue">{mapsLoading ? '…' : `${filteredHotspots.length} hotspots`}</span>
          </div>
          {mapsLoading ? (
            <Skeleton className="w-full rounded-xl" style={{ height: '420px' }} />
          ) : (
            <HotspotMap
              markers={filteredHotspots}
              height="420px"
              renderPopup={(m) => `
                <div style="min-width:200px">
                  <strong style="color:#00D4FF;font-size:14px">${m.junction_name}</strong><br/>
                  <span style="color:#94a3b8">Violations: ${formatNumber(m.total_violations)}</span><br/>
                  <span style="color:#94a3b8">CIP Score: ${formatNumber(m.total_cip, 1)}</span><br/>
                  <span style="color:#94a3b8">Station: ${m.police_station || '—'}</span><br/>
                  <span style="color:#10B981">Rank: #${m.rank}</span>
                </div>
              `}
            />
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Dataset Summary</h3>
          <p className="text-xs text-slate-500 mb-4">
            {summary ? formatDateRange(summary.date_range?.start, summary.date_range?.end) : <Skeleton className="h-3 w-full" />}
          </p>

          <div className="space-y-3 mb-5">
            {summaryLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              : qualityBars.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white font-medium">{item.value.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{item.note}</p>
                </div>
              ))
            }
          </div>

          {/* Data quality issues */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Data Quality Notes</p>
            {summaryLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              : (summary.data_quality?.issues || []).slice(0, 3).map((issue, i) => (
                <div key={i} className="p-2 rounded-lg bg-navy-800/50 border border-white/5">
                  <p className="text-[11px] text-slate-400 leading-relaxed">{issue}</p>
                </div>
              ))
            }
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-2 rounded-lg bg-navy-800/50 text-center">
              {summaryLoading
                ? <Skeleton className="h-5 w-1/2 mx-auto" />
                : <p className="text-sm font-bold text-accent-purple">{summary.total_police_stations}</p>
              }
              <p className="text-[10px] text-slate-500">Stations</p>
            </div>
            <div className="p-2 rounded-lg bg-navy-800/50 text-center">
              {summaryLoading
                ? <Skeleton className="h-5 w-1/2 mx-auto" />
                : <p className="text-sm font-bold text-accent-cyan">{summary.total_junctions}</p>
              }
              <p className="text-[10px] text-slate-500">Junctions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Monthly Violation Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Records per month from dataset</p>
          {summaryLoading
            ? <Skeleton className="w-full h-72" />
            : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={temporalData}>
                  <defs>
                    <linearGradient id="violGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<GlassTooltip formatter={(v) => [formatNumber(v), 'Violations']} />} />
                  <Area type="monotone" dataKey="violations" stroke="#00D4FF" fill="url(#violGrad)" strokeWidth={2} name="Violations" />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Vehicle Type Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Violations by vehicle category</p>
          {summaryLoading
            ? <Skeleton className="w-full h-72" />
            : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vehicleData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GlassTooltip formatter={(v) => [formatNumber(v), 'Violations']} />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </motion.div>
      </div>

      {/* Bottom KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
          : (
            <>
              <KPICard title="Junction Records" value={summary.total_junction_records} icon={MapPin} color="blue" subtitle="With named junction" />
              <KPICard title="Total Columns" value={summary.total_columns} icon={Database} color="purple" subtitle="In dataset" />
              <KPICard title="Vehicle Types" value={Object.keys(summary.vehicle_types || {}).length} icon={Filter} color="green" subtitle="Unique categories" />
              <KPICard title="Violation Types" value={Object.keys(summary.violation_types || {}).length} icon={TrendingUp} color="orange" subtitle="Unique categories" />
            </>
          )
        }
      </div>
    </div>
  )
}

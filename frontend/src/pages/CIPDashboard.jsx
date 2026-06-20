import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Activity, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import DataTable from '@/components/common/DataTable'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import GlassTooltip from '@/components/common/GlassTooltip'
import { fetchCIP } from '@/api/client'
import { formatNumber } from '@/lib/utils'

const PIE_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#10B981']

export default function CIPDashboard() {
  const { data, loading, error, reload } = useFetchData(() => fetchCIP(50))

  if (loading) return <LoadingState message="Computing CIP analytics..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const junctions = data.junctions || []
  const top10 = junctions.slice(0, 10).map((j) => ({
    name: j.junction_name?.length > 20 ? j.junction_name.slice(0, 20) + '…' : j.junction_name,
    fullName: j.junction_name,
    cip: j.total_cip,
  }))

  const dist = data.cip_distribution || {}
  const pieData = [
    { name: 'Very High', value: junctions.filter((j) => j.total_cip >= dist.mean + dist.std).length },
    { name: 'High', value: junctions.filter((j) => j.total_cip >= dist.mean && j.total_cip < dist.mean + dist.std).length },
    { name: 'Medium', value: junctions.filter((j) => j.total_cip >= dist.median && j.total_cip < dist.mean).length },
    { name: 'Low', value: junctions.filter((j) => j.total_cip < dist.median).length },
  ].filter((d) => d.value > 0)

  const stationBreakdown = {}
  junctions.forEach((j) => {
    const st = j.police_station || 'Unknown'
    stationBreakdown[st] = (stationBreakdown[st] || 0) + j.total_cip
  })
  const stationData = Object.entries(stationBreakdown)
    .map(([name, cip]) => ({ name: name.replace(' PS', ''), cip }))
    .sort((a, b) => b.cip - a.cip)
    .slice(0, 10)

  const highImpact = junctions.filter((j) => j.total_cip >= dist.mean).length

  const columns = [
    { key: 'rank', label: 'Rank', render: (r) => <span className="text-accent-cyan font-bold">#{r.rank}</span> },
    { key: 'junction_name', label: 'Junction' },
    { key: 'total_cip', label: 'Total CIP', render: (r) => formatNumber(r.total_cip, 1) },
    { key: 'avg_cip', label: 'Avg CIP', render: (r) => formatNumber(r.avg_cip, 2) },
    { key: 'total_violations', label: 'Violations', render: (r) => formatNumber(r.total_violations) },
    { key: 'police_station', label: 'Station' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total CIP" value={junctions.reduce((s, j) => s + j.total_cip, 0)} icon={Activity} color="purple" decimals={0} />
        <KPICard title="Mean CIP" value={dist.mean} icon={BarChart3} color="cyan" decimals={1} />
        <KPICard title="Max CIP" value={dist.max} icon={TrendingUp} color="red" decimals={1} />
        <KPICard title="High-Impact Junctions" value={highImpact} icon={AlertCircle} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top 10 Junctions by CIP</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={top10} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip labelFormatter={(_, p) => p?.[0]?.payload?.fullName} formatter={(v) => [formatNumber(v, 1), 'CIP']} />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar dataKey="cip" fill="url(#cipBarGrad)" radius={[0, 6, 6, 0]} />
              <defs>
                <linearGradient id="cipBarGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">CIP Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Station-wise CIP Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={70} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<GlassTooltip formatter={(v) => [formatNumber(v, 1), 'Total CIP']} />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar dataKey="cip" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">CIP Rankings</h3>
        <DataTable columns={columns} data={junctions} searchPlaceholder="Search junctions..." />
      </motion.div>
    </div>
  )
}

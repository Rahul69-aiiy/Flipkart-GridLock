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
import { Building2, Users, Shield, TrendingUp } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import DataTable from '@/components/common/DataTable'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import { fetchStations } from '@/api/client'
import GlassTooltip from '@/components/common/GlassTooltip'
import { formatNumber } from '@/lib/utils'

const PIE_COLORS = ['#00D4FF', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#EC4899']

export default function StationAnalytics() {
  const { data, loading, error, reload } = useFetchData(fetchStations)

  if (loading) return <LoadingState message="Loading station analytics..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const stations = data.stations || []
  const top10 = stations.slice(0, 10)

  const pieData = top10.map((s) => ({
    name: s.police_station?.replace(' PS', '') || 'Unknown',
    value: s.total_violations,
  }))

  const barData = top10.map((s) => ({
    name: (s.police_station || '').replace(' PS', '').slice(0, 12),
    fullName: s.police_station,
    cip: s.total_cip,
    violations: s.total_violations,
  }))

  const columns = [
    {
      key: 'efficiency_rank',
      label: 'Rank',
      render: (r) => <span className="text-accent-cyan font-bold">#{r.efficiency_rank}</span>,
    },
    { key: 'police_station', label: 'Police Station' },
    { key: 'total_violations', label: 'Violations', render: (r) => formatNumber(r.total_violations) },
    { key: 'total_cip', label: 'Total CIP', render: (r) => <span className="text-accent-purple">{formatNumber(r.total_cip, 1)}</span> },
    { key: 'avg_cip', label: 'Avg CIP', render: (r) => formatNumber(r.avg_cip, 2) },
    { key: 'junctions_covered', label: 'Junctions', render: (r) => formatNumber(r.junctions_covered) },
    { key: 'cip_per_officer', label: 'CIP/Officer', render: (r) => formatNumber(r.cip_per_officer, 1) },
    { key: 'unique_officers', label: 'Officers', render: (r) => r.unique_officers },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Stations" value={data.total_stations} icon={Building2} color="blue" />
        <KPICard title="Top Station Violations" value={stations[0]?.total_violations} icon={TrendingUp} color="cyan" subtitle={stations[0]?.police_station} />
        <KPICard title="Total Officers" value={stations.reduce((s, st) => s + st.unique_officers, 0)} icon={Users} color="purple" />
        <KPICard title="Avg CIP/Station" value={stations.length ? stations.reduce((s, st) => s + st.total_cip, 0) / stations.length : 0} icon={Shield} color="green" decimals={0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Performing Stations — CIP</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar dataKey="cip" fill="#8B5CF6" name="Total CIP" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Target Area Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value" nameKey="name">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<GlassTooltip formatter={(v) => [formatNumber(v), 'Violations']} />} />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Station Rankings</h3>
        <DataTable columns={columns} data={stations} searchPlaceholder="Search stations..." />
      </motion.div>
    </div>
  )
}

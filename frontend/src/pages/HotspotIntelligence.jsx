import { motion } from 'framer-motion'
import { MapPin, AlertTriangle } from 'lucide-react'
import HotspotMap from '@/components/maps/HotspotMap'
import DataTable from '@/components/common/DataTable'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import { fetchHotspots } from '@/api/client'
import { formatNumber } from '@/lib/utils'

export default function HotspotIntelligence() {
  const { data, loading, error, reload } = useFetchData(() => fetchHotspots(50))

  if (loading) return <LoadingState message="Loading hotspot intelligence..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const columns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (row) => (
        <span className={`font-bold ${row.rank <= 3 ? 'text-accent-cyan' : 'text-slate-400'}`}>
          #{row.rank}
        </span>
      ),
    },
    { key: 'junction_name', label: 'Junction' },
    {
      key: 'total_cip',
      label: 'CIP',
      render: (row) => <span className="font-medium text-accent-purple">{formatNumber(row.total_cip, 1)}</span>,
    },
    {
      key: 'total_violations',
      label: 'Violations',
      render: (row) => formatNumber(row.total_violations),
    },
    { key: 'police_station', label: 'Police Station' },
    {
      key: 'top_violation',
      label: 'Top Violation',
      render: (row) => <span className="badge-yellow">{row.top_violation}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-accent-cyan" />
          <div>
            <p className="text-xs text-slate-500">Total Hotspots</p>
            <p className="text-lg font-bold text-white">{data.total_hotspots}</p>
          </div>
        </div>
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-accent-orange" />
          <div>
            <p className="text-xs text-slate-500">DBSCAN Clusters</p>
            <p className="text-lg font-bold text-white">{data.dbscan_clusters?.n_clusters || 0}</p>
          </div>
        </div>
        <div className="glass-card px-4 py-3">
          <p className="text-xs text-slate-500">Detection Method</p>
          <p className="text-sm font-medium text-accent-cyan">{data.method}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="xl:col-span-3 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Hotspot Map Visualization</h3>
          <HotspotMap
            markers={data.hotspots}
            height="560px"
            renderPopup={(m) => `
              <div style="min-width:220px">
                <strong style="color:#00D4FF">${m.junction_name}</strong><br/>
                <span style="color:#94a3b8">Rank: #${m.rank}</span><br/>
                <span style="color:#94a3b8">Violations: ${formatNumber(m.total_violations)}</span><br/>
                <span style="color:#94a3b8">CIP: ${formatNumber(m.total_cip, 1)}</span><br/>
                <span style="color:#94a3b8">Station: ${m.police_station}</span><br/>
                <span style="color:#F59E0B">${m.top_violation}</span>
              </div>
            `}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="xl:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Top 10 Hotspots</h3>
          <p className="text-xs text-slate-500 mb-4">Ranked by congestion impact</p>
          <DataTable
            columns={columns}
            data={data.hotspots.slice(0, 10)}
            searchable={false}
            pageSize={10}
          />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">All Hotspots</h3>
        <DataTable columns={columns} data={data.hotspots} searchPlaceholder="Search junctions..." />
      </motion.div>
    </div>
  )
}

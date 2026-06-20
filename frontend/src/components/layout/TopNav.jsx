import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, Calendar } from 'lucide-react'
import useStore from '@/store/useStore'
import { fetchHealth, fetchSummary } from '@/api/client'
import { formatDateRange } from '@/lib/utils'
import { useFetchData } from '@/components/common/DataStates'

const pageTitles = {
  '/': 'Overview Dashboard',
  '/hotspots': 'Hotspot Intelligence',
  '/cip': 'CIP Dashboard',
  '/forecast': 'Forecasting',
  '/confidence': 'Confidence Engine',
  '/opportunities': 'Opportunities',
  '/resource-planner': 'Resource Planner',
  '/target-planner': 'Target Planner',
  '/value-proof': 'Value Proof',
  '/stations': 'Station Analytics',
  '/coverage': 'Coverage Analysis',
  '/settings': 'Settings',
}

export default function TopNav() {
  const location = useLocation()
  const { searchQuery, setSearchQuery, apiHealthy, setApiHealthy } = useStore()
  const title = pageTitles[location.pathname] || 'Dashboard'

  // Date range from real backend data
  const { data: summary } = useFetchData(fetchSummary)

  useEffect(() => {
    fetchHealth().then((h) => setApiHealthy(h?.status === 'healthy'))
  }, [setApiHealthy])

  return (
    <header
      className="sticky top-0 z-30 bg-navy-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <div className="flex items-center gap-3 mt-0.5">
            {summary?.date_range && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {formatDateRange(summary.date_range.start, summary.date_range.end)}
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-xs ${apiHealthy ? 'text-accent-green' : apiHealthy === false ? 'text-accent-red' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiHealthy ? 'bg-accent-green animate-pulse' : apiHealthy === false ? 'bg-accent-red' : 'bg-slate-500'}`} />
              {apiHealthy ? 'API Connected' : apiHealthy === false ? 'API Offline' : 'Checking...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search junctions, stations..."
              className="input-field pl-10 w-64 py-2"
            />
          </div>

          <button className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" title="Notifications">
            <Bell className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  )
}

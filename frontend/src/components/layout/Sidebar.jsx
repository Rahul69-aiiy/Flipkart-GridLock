import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  MapPin,
  BarChart3,
  TrendingUp,
  Shield,
  Target,
  Users,
  Crosshair,
  BadgeDollarSign,
  Building2,
  PieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import useStore from '@/store/useStore'
import { formatNumber } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/hotspots', label: 'Hotspot Intelligence', icon: MapPin },
  { path: '/cip', label: 'CIP Dashboard', icon: BarChart3 },
  { path: '/forecast', label: 'Forecasting', icon: TrendingUp },
  { path: '/confidence', label: 'Confidence Engine', icon: Shield },
  { path: '/opportunities', label: 'Opportunities', icon: Target },
  { path: '/resource-planner', label: 'Resource Planner', icon: Users },
  { path: '/target-planner', label: 'Target Planner', icon: Crosshair },
  { path: '/stations', label: 'Station Analytics', icon: Building2 },
  { path: '/coverage', label: 'Coverage Analysis', icon: PieChart },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, topOpportunity } = useStore()

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      className="fixed left-0 top-0 h-screen z-40 bg-navy-900/90 backdrop-blur-xl border-r border-white/5 flex flex-col"
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center">
            <img src="/favicon.svg" alt="ParkSight Logo" className="w-full h-full" />
          </div>
        </div>
        {!sidebarCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-sm font-bold text-white tracking-wide">ParkSight AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Intelligence Platform</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive
                ? sidebarCollapsed
                  ? 'sidebar-item-active justify-center px-2'
                  : 'sidebar-item-active'
                : sidebarCollapsed
                  ? 'sidebar-item justify-center px-2'
                  : 'sidebar-item'
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!sidebarCollapsed && topOpportunity && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Top Opportunity</p>
          <p className="text-xs font-semibold text-white truncate">{topOpportunity.junction_name}</p>
          <p className="text-sm font-bold text-accent-cyan mt-1">
            Score: {formatNumber(topOpportunity.opportunity_score, 1)}
          </p>
        </div>
      )}

      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center py-3 border-t border-white/5 text-slate-500 hover:text-accent-cyan transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  )
}

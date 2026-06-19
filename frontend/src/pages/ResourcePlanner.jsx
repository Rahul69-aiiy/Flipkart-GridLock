import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, PieChart, Target, Loader2, CheckCircle } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import DataTable from '@/components/common/DataTable'
import HotspotMap from '@/components/maps/HotspotMap'
import { formatNumber } from '@/lib/utils'
import { postResourcePlan } from '@/api/client'

export default function ResourcePlanner() {
  const [hours, setHours] = useState(15)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generatePlan = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await postResourcePlan(Number(hours))
      setPlan(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'junction_name', label: 'Junction' },
    { key: 'opportunity_score', label: 'Score', render: (r) => formatNumber(r.opportunity_score, 2) },
    { key: 'hours', label: 'Hours', render: (r) => <span className="text-accent-cyan font-medium">{r.hours}h</span> },
    { key: 'window', label: 'Peak Window', render: (r) => <span className="badge-blue">{r.window}</span> },
    { key: 'police_station', label: 'Station' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Officer Deployment Planner</h3>
        <p className="text-sm text-slate-500 mb-6">Optimize junction coverage within your officer hours budget</p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Officer Hours Budget</label>
            <input
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="input-field text-lg font-bold"
              placeholder="15"
            />
          </div>
          <button onClick={generatePlan} disabled={loading || !hours} className="btn-primary min-w-[160px]">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : 'Generate Plan'}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-accent-red">{error}</p>
        )}
      </motion.div>

      {plan && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Hours Used" value={plan.hours_used} icon={Clock} color="cyan" subtitle={`of ${plan.officer_hours_budget} budget`} />
            <KPICard title="Coverage Achieved" value={plan.coverage_percentage} icon={PieChart} color="green" isPercent decimals={1} />
            <KPICard title="Junctions Selected" value={plan.deployment?.length || 0} icon={Users} color="purple" />
            <KPICard title="Opportunity Captured" value={plan.total_opportunity_available} icon={Target} color="orange" decimals={0} subtitle={plan.solver_status} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-accent-green" />
                <h3 className="text-sm font-semibold text-white">Deployment Map</h3>
              </div>
              <HotspotMap
                markers={plan.deployment.map((d) => ({
                  ...d,
                  total_cip: d.opportunity_score,
                  total_violations: d.hours,
                }))}
                height="400px"
                showHeatmap={false}
                renderPopup={(m) => `
                  <div>
                    <strong style="color:#00D4FF">${m.junction_name}</strong><br/>
                    <span style="color:#94a3b8">Hours: ${m.hours}h</span><br/>
                    <span style="color:#94a3b8">Window: ${m.window}</span><br/>
                    <span style="color:#10B981">Score: ${formatNumber(m.opportunity_score, 2)}</span>
                  </div>
                `}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Plan Summary</h3>
              <p className="text-xs text-slate-500 mb-4">AI-optimized deployment schedule</p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 rounded-xl bg-navy-800/50">
                  <span className="text-slate-400">Mode</span>
                  <span className="text-white font-medium">{plan.mode}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-navy-800/50">
                  <span className="text-slate-400">Solver Status</span>
                  <span className="text-accent-green font-medium">{plan.solver_status}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-navy-800/50">
                  <span className="text-slate-400">Efficiency</span>
                  <span className="text-accent-cyan font-medium">
                    {plan.officer_hours_budget > 0 ? ((plan.hours_used / plan.officer_hours_budget) * 100).toFixed(0) : 0}% budget utilized
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Recommended Deployment</h3>
            <DataTable columns={columns} data={plan.deployment} searchable={false} />
          </motion.div>
        </>
      )}

      {!plan && !loading && (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500">Enter officer hours and click Generate Plan to see AI-optimized deployment</p>
        </div>
      )}
    </div>
  )
}

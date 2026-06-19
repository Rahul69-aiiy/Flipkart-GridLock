import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crosshair, Clock, PieChart, Target, Loader2 } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import DataTable from '@/components/common/DataTable'
import HotspotMap from '@/components/maps/HotspotMap'
import { formatNumber } from '@/lib/utils'
import { postTargetPlan } from '@/api/client'

export default function TargetPlanner() {
  const [target, setTarget] = useState(80)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await postTargetPlan(Number(target))
      setPlan(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deploymentWithCumulative = plan?.deployment?.map((d, i, arr) => {
    const cumulative = arr.slice(0, i + 1).reduce((s, x) => s + x.opportunity_score, 0)
    const total = plan.total_opportunity_available || 1
    return { ...d, cumulative_pct: (cumulative / total) * 100 }
  }) || []

  const columns = [
    { key: 'junction_name', label: 'Junction' },
    { key: 'opportunity_score', label: 'Score', render: (r) => formatNumber(r.opportunity_score, 2) },
    { key: 'hours', label: 'Hours', render: (r) => <span className="text-accent-cyan">{r.hours}h</span> },
    { key: 'window', label: 'Window', render: (r) => <span className="badge-blue">{r.window}</span> },
    {
      key: 'cumulative_pct',
      label: 'Cumulative %',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 bg-navy-800 rounded-full overflow-hidden">
            <div className="h-full bg-accent-green rounded-full" style={{ width: `${Math.min(r.cumulative_pct, 100)}%` }} />
          </div>
          <span className="text-xs">{r.cumulative_pct?.toFixed(1)}%</span>
        </div>
      ),
    },
    { key: 'police_station', label: 'Station' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Target Coverage Planner</h3>
        <p className="text-sm text-slate-500 mb-6">Calculate required officer hours to achieve your coverage target</p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Target Coverage (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="input-field text-lg font-bold"
              placeholder="80"
            />
          </div>
          <button onClick={calculate} disabled={loading || !target} className="btn-primary min-w-[200px]">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</> : 'Calculate Required Hours'}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-accent-red">{error}</p>}
      </motion.div>

      {plan && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Required Hours" value={plan.required_officer_hours} icon={Clock} color="cyan" subtitle="To meet target" />
            <KPICard title="Coverage Achieved" value={plan.achieved_coverage_pct} icon={PieChart} color="green" isPercent decimals={1} subtitle={`Target: ${plan.target_coverage_pct}%`} />
            <KPICard title="Junctions Needed" value={plan.deployment?.length || 0} icon={Crosshair} color="purple" />
            <KPICard title="Total Opportunity" value={plan.total_opportunity_available} icon={Target} color="orange" decimals={0} subtitle={plan.solver_status} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Deployment Coverage Map</h3>
              <HotspotMap
                markers={plan.deployment}
                height="400px"
                showHeatmap={false}
                getMarkerColor={() => '#10B981'}
                renderPopup={(m) => `
                  <div>
                    <strong style="color:#10B981">${m.junction_name}</strong><br/>
                    <span style="color:#94a3b8">${m.hours}h · ${m.window}</span>
                  </div>
                `}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 flex flex-col justify-center">
              <div className="text-center p-8">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Required Officer Hours</p>
                <p className="text-6xl font-bold text-accent-cyan mb-2">{plan.required_officer_hours}</p>
                <p className="text-sm text-slate-400">hours to achieve {plan.target_coverage_pct}% coverage</p>
                <div className="mt-8 w-full h-3 bg-navy-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${plan.achieved_coverage_pct}%` }}
                    className="h-full bg-gradient-to-r from-accent-green to-accent-cyan rounded-full"
                  />
                </div>
                <p className="text-sm text-accent-green mt-2">{plan.achieved_coverage_pct?.toFixed(1)}% achieved</p>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Deployment Plan</h3>
            <DataTable columns={columns} data={deploymentWithCumulative} searchable={false} />
          </motion.div>
        </>
      )}

      {!plan && !loading && (
        <div className="glass-card p-12 text-center">
          <Crosshair className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500">Set a target coverage percentage and calculate the required deployment</p>
        </div>
      )}
    </div>
  )
}

import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Brain, Target, TrendingUp, TrendingDown, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react'
import KPICard from '@/components/common/KPICard'
import DataTable from '@/components/common/DataTable'
import { LoadingState, ErrorState, useFetchData } from '@/components/common/DataStates'
import { fetchForecast } from '@/api/client'
import GlassTooltip from '@/components/common/GlassTooltip'
import { formatNumber, getTrendBadge } from '@/lib/utils'

const TREND_COLORS = { increasing: '#10B981', stable: '#F59E0B', decreasing: '#EF4444' }

const TrendIcon = ({ trend }) => {
  if (trend === 'increasing') return <ArrowUp className="w-3 h-3" />
  if (trend === 'decreasing') return <ArrowDown className="w-3 h-3" />
  return <ArrowRight className="w-3 h-3" />
}

export default function Forecasting() {
  const { data, loading, error, reload } = useFetchData(() => fetchForecast(30))

  if (loading) return <LoadingState message="Running AI forecast models..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const forecasts = data.forecasts || []

  const chartData = forecasts.slice(0, 15).map((f) => ({
    name: f.junction_name?.length > 18 ? f.junction_name.slice(0, 18) + '…' : f.junction_name,
    fullName: f.junction_name,
    historical: f.historical_avg_cip,
    predicted: f.predicted_cip,
  }))

  const trendCounts = { increasing: 0, stable: 0, decreasing: 0 }
  forecasts.forEach((f) => { if (trendCounts[f.trend] != null) trendCounts[f.trend]++ })
  const trendPie = [
    { name: 'Increasing', value: trendCounts.increasing, color: TREND_COLORS.increasing },
    { name: 'Stable', value: trendCounts.stable, color: TREND_COLORS.stable },
    { name: 'Decreasing', value: trendCounts.decreasing, color: TREND_COLORS.decreasing },
  ].filter((d) => d.value > 0)

  // MAE improvement: positive = XGBoost is better (lower MAE), negative = moving avg is better
  const maeDiff = data.mae_moving_average && data.mae_xgboost
    ? ((data.mae_moving_average - data.mae_xgboost) / data.mae_moving_average) * 100
    : null

  const columns = [
    { key: 'rank', label: 'Rank', render: (r) => <span className="text-accent-cyan font-bold">#{r.rank}</span> },
    { key: 'junction_name', label: 'Junction' },
    { key: 'historical_avg_cip', label: 'Historical CIP', render: (r) => formatNumber(r.historical_avg_cip, 1) },
    {
      key: 'predicted_cip',
      label: 'Predicted CIP',
      render: (r) => <span className="text-accent-purple font-medium">{formatNumber(r.predicted_cip, 1)}</span>,
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (r) => {
        const badge = getTrendBadge(r.trend)
        return (
          <span className={`${badge.class} flex items-center gap-1 w-fit`}>
            <TrendIcon trend={r.trend} />
            {badge.label}
          </span>
        )
      },
    },
    { key: 'police_station', label: 'Station' },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs — all from backend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <Brain className="w-5 h-5 text-accent-purple" />
          <div>
            <p className="text-xs text-slate-500">AI Model Used</p>
            <p className="text-base font-bold text-accent-purple uppercase">{data.model_used}</p>
          </div>
        </div>
        <KPICard title="MAE — XGBoost" value={data.mae_xgboost} icon={Target} color="cyan" decimals={4} />
        <KPICard title="MAE — Moving Avg" value={data.mae_moving_average} icon={TrendingUp} color="blue" decimals={4} />
        {maeDiff != null ? (
          <KPICard
            title={maeDiff >= 0 ? 'XGBoost vs Baseline' : 'Baseline vs XGBoost'}
            value={Math.abs(maeDiff)}
            icon={maeDiff >= 0 ? TrendingUp : TrendingDown}
            color={maeDiff >= 0 ? 'green' : 'orange'}
            decimals={1}
            isPercent
            subtitle={maeDiff >= 0 ? 'XGBoost lower MAE' : 'Moving avg lower MAE'}
          />
        ) : (
          <KPICard title="Junctions Forecast" value={data.total_junctions_forecast} icon={Target} color="green" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Historical vs Predicted CIP</h3>
          <p className="text-xs text-slate-500 mb-4">Top 15 junctions by predicted CIP</p>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={chartData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="historical" fill="#3B82F6" name="Historical Avg CIP" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predicted" fill="#8B5CF6" name="Predicted CIP" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Trend Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={trendPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" nameKey="name">
                {trendPie.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {trendPie.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value} junctions</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-navy-800/50 border border-white/5">
            <p className="text-xs text-slate-500">Total Forecast</p>
            <p className="text-lg font-bold text-white">{data.total_junctions_forecast} junctions</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Forecast Rankings</h3>
        <DataTable columns={columns} data={forecasts} searchPlaceholder="Search junctions..." />
      </motion.div>
    </div>
  )
}

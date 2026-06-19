import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

const colorMap = {
  cyan:   'from-accent-cyan/20 to-accent-cyan/5 border-accent-cyan/20 text-accent-cyan',
  blue:   'from-accent-blue/20 to-accent-blue/5 border-accent-blue/20 text-accent-blue',
  purple: 'from-accent-purple/20 to-accent-purple/5 border-accent-purple/20 text-accent-purple',
  green:  'from-accent-green/20 to-accent-green/5 border-accent-green/20 text-accent-green',
  orange: 'from-accent-orange/20 to-accent-orange/5 border-accent-orange/20 text-accent-orange',
  teal:   'from-accent-teal/20 to-accent-teal/5 border-accent-teal/20 text-accent-teal',
  red:    'from-accent-red/20 to-accent-red/5 border-accent-red/20 text-accent-red',
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'cyan',
  trend,
  trendLabel,
  decimals = 0,
  isPercent = false,
}) {
  const c = colorMap[color] || colorMap.cyan
  const [fromTo, border, iconColor] = [
    c.split(' ').slice(0, 2).join(' '),
    c.split(' ')[2],
    c.split(' ')[3],
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`glass-card-hover p-5 bg-gradient-to-br ${fromTo} border ${border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-navy-800/80 ${iconColor}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend != null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="kpi-value">
        {isPercent ? (
          <>
            <AnimatedCounter value={value ?? 0} decimals={decimals} />
            <span className="text-lg text-slate-400">%</span>
          </>
        ) : (
          <AnimatedCounter value={value ?? 0} decimals={decimals} />
        )}
      </p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {trendLabel && <p className="text-xs text-slate-600 mt-1">{trendLabel}</p>}
    </motion.div>
  )
}

import React from 'react'

export default function GlassTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (active && payload && payload.length) {
    const formattedLabel = labelFormatter ? labelFormatter(label, payload) : label
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-2xl min-w-[120px] pointer-events-none">
        {formattedLabel && (
          <p className="text-xs font-semibold text-white mb-1.5 border-b border-white/10 pb-1">
            {formattedLabel}
          </p>
        )}
        <div className="space-y-1.5">
          {payload.map((item, index) => {
            const [val, name] = formatter 
              ? formatter(item.value, item.name, item) 
              : [item.value, item.name]
            
            const color = item.color || item.payload?.fill || '#3B82F6'
            
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="text-slate-300 font-medium">{name || 'Value'}</span>
                </div>
                <span className="text-white font-bold ml-auto">{val}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return null
}

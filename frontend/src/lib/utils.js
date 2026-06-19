import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num, decimals = 0) {
  if (num == null || isNaN(num)) return '—'
  return Number(num).toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })
}

export function formatPercent(num, decimals = 1) {
  if (num == null || isNaN(num)) return '—'
  return `${Number(num).toFixed(decimals)}%`
}

export function formatDateRange(start, end) {
  if (!start || !end) return '—'
  const fmt = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

export function formatHourWindow(start, end) {
  if (start == null || end == null) return '—'
  const pad = (h) => String(h).padStart(2, '0')
  return `${pad(start)}:00 – ${pad(end)}:00`
}

export function getRiskColor(cip, maxCip) {
  const ratio = maxCip > 0 ? cip / maxCip : 0
  if (ratio >= 0.8) return '#EF4444'
  if (ratio >= 0.6) return '#F59E0B'
  if (ratio >= 0.3) return '#EAB308'
  if (ratio >= 0.1) return '#10B981'
  return '#3B82F6'
}

export function getTrendBadge(trend) {
  const map = {
    increasing: { label: '↑ Increasing', class: 'badge-green' },
    stable: { label: '→ Stable', class: 'badge-yellow' },
    decreasing: { label: '↓ Decreasing', class: 'badge-red' },
  }
  return map[trend] || { label: trend, class: 'badge-blue' }
}

export function getConfidenceLevel(score) {
  if (score >= 0.8) return { label: 'High', color: '#10B981' }
  if (score >= 0.6) return { label: 'Medium', color: '#F59E0B' }
  if (score >= 0.4) return { label: 'Low', color: '#EF4444' }
  return { label: 'Very Low', color: '#6B7280' }
}

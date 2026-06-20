import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import useStore from '@/store/useStore'

export default function DataTable({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 15,
  emptyMessage = 'No data available',
}) {
  const globalSearch = useStore((s) => s.searchQuery)
  const setGlobalSearch = useStore((s) => s.setSearchQuery)

  const [search, setSearch] = useState(globalSearch)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)

  useEffect(() => {
    setSearch(globalSearch)
  }, [globalSearch])

  const filtered = useMemo(() => {
    let rows = [...data]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = col.accessor ? col.accessor(row) : row[col.key]
          return String(val ?? '').toLowerCase().includes(q)
        })
      )
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      rows.sort((a, b) => {
        const av = col?.accessor ? col.accessor(a) : a[sortKey]
        const bv = col?.accessor ? col.accessor(b) : b[sortKey]
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    }
    return rows
  }, [data, search, sortKey, sortDir, columns])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-accent-cyan" /> : <ChevronDown className="w-3 h-3 text-accent-cyan" />
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { 
              setSearch(e.target.value); 
              setGlobalSearch(e.target.value); 
              setPage(0); 
            }}
            placeholder={searchPlaceholder}
            className="input-field pl-10"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="data-table">
          <thead>
            <tr className="bg-navy-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-300' : ''}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable !== false && <SortIcon colKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id || row.junction_name || row.police_station || i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : (col.accessor ? col.accessor(row) : row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1.5" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn-secondary px-3 py-1.5" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

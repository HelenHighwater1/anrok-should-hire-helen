import { useSimulation } from '../context/SimulationContext'
import { getNexusDataForState } from '../data/nexus-data'
import type { Filing, FilingStatus } from '../types'

const STATUS_ORDER: Record<FilingStatus, number> = { overdue: 0, due: 1, upcoming: 2, filed: 3 }

const STATUS_STYLES: Record<FilingStatus, { dot: string; label: string; text: string }> = {
  overdue:  { dot: 'bg-red-600',   label: 'Overdue',  text: 'text-red-700'   },
  due:      { dot: 'bg-amber-500', label: 'Due',      text: 'text-amber-800' },
  upcoming: { dot: 'bg-neutral-400',  label: 'Upcoming', text: 'text-neutral-500'  },
  filed:    { dot: 'bg-emerald-600', label: 'Filed',  text: 'text-emerald-800' },
}

const STATE_NAMES: Record<string, string> = {
  CA: 'California', TX: 'Texas', NY: 'New York', FL: 'Florida',
  WA: 'Washington', IL: 'Illinois', GA: 'Georgia', MA: 'Massachusetts',
  CO: 'Colorado', AZ: 'Arizona',
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function quarterLabel(quarter: 1 | 2 | 3 | 4, year: number): string {
  return `Q${quarter} ${year}`
}

/** Narrow: fixed tracks for horizontal scroll. `lg`: fluid columns so the table fills the panel width. */
const COLS =
  'grid-cols-[2.5rem_4rem_3rem_3.5rem_5.5rem_4.5rem_5.5rem_5rem] lg:grid-cols-[2.5rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]'

function FilingRow({ filing }: { filing: Filing }) {
  const style = STATUS_STYLES[filing.status]
  const nexusData = getNexusDataForState(filing.stateCode)
  const taxRate = nexusData ? `${(nexusData.stateTaxRate * 100).toFixed(2)}%` : '—'

  return (
    <div className={`grid w-full ${COLS} items-center px-4 py-2 border-b border-neutral-900/10 hover:bg-neutral-50/80 text-xs font-mono`}>
      <span className="font-mono text-neutral-500">{filing.stateCode}</span>
      <span className="text-neutral-600 truncate">{STATE_NAMES[filing.stateCode]}</span>
      <span className="text-neutral-600 tabular-nums text-right">{filing.transactionCount.toLocaleString()}</span>
      <span className="text-neutral-600 tabular-nums text-right">{taxRate}</span>
      <span className="text-neutral-600 tabular-nums text-right">{formatCurrency(filing.revenue)}</span>
      <span className="text-neutral-600 tabular-nums text-right">{quarterLabel(filing.quarter, filing.year)}</span>
      <span className="text-neutral-900 font-bold tabular-nums text-right">{formatCurrency(filing.taxOwed)}</span>
      <div className="flex items-center justify-end gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
        <span className={style.text}>{style.label}</span>
      </div>
    </div>
  )
}

export function FilingPanel() {
  const { state } = useSimulation()
  const { filings } = state

  const sorted = [...filings].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.stateCode.localeCompare(b.stateCode)
  )

  const overdueCount = filings.filter((f) => f.status === 'overdue').length
  const dueCount = filings.filter((f) => f.status === 'due').length

  return (
    <div
      className="flex flex-col border border-neutral-900 rounded-sm bg-white h-auto max-h-72 lg:h-52 lg:max-h-none shrink-0 overflow-hidden"
      data-tour="filing-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-900/15 shrink-0 bg-white">
        <span className="text-sm font-semibold text-neutral-900 uppercase tracking-[0.08em]">Filing Obligations</span>
        <div className="flex items-center gap-3 font-mono text-xs">
          {overdueCount > 0 && (
            <span className="text-red-700 font-medium">
              {overdueCount} overdue
            </span>
          )}
          {dueCount > 0 && (
            <span className="text-amber-800 font-medium">
              {dueCount} due
            </span>
          )}
        </div>
      </div>

      {/* Table: horizontal scroll on narrow viewports so grid columns stay identical to desktop */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="overflow-x-auto flex-1 min-h-0 flex flex-col">
          <div className="min-w-[34rem] w-full lg:min-w-0 flex flex-col flex-1 min-h-0">
            {/* Column labels */}
            {sorted.length > 0 && (
              <div className={`grid w-full ${COLS} px-4 py-1.5 border-b border-neutral-900/10 text-xs font-mono text-neutral-500 shrink-0 uppercase tracking-wide`}>
                <span>ST</span>
                <span>State</span>
                <span className="text-right">Sales</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Gross</span>
                <span className="text-right">Quarter</span>
                <span className="text-right font-semibold text-neutral-600">Tax Owed</span>
                <span className="text-right">Status</span>
              </div>
            )}

            {/* Rows */}
            <div className="overflow-y-auto flex-1 min-h-0">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[10rem] lg:h-full text-neutral-500 gap-1 py-6 font-mono">
                  <span className="text-sm">No filing obligations yet</span>
                  <span className="text-xs">Tax collection begins once nexus is established</span>
                </div>
              ) : (
                sorted.map((filing) => <FilingRow key={filing.id} filing={filing} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

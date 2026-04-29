import { useSimulation } from '../context/SimulationContext'
import type { Transaction } from '../types'

const STATE_NAMES: Record<string, string> = {
  CA: 'California', TX: 'Texas', NY: 'New York', FL: 'Florida',
  WA: 'Washington', IL: 'Illinois', GA: 'Georgia', MA: 'Massachusetts',
  CO: 'Colorado', AZ: 'Arizona',
}

const PLAN_COLORS: Record<string, string> = {
  Starter:    'border border-neutral-400 bg-white text-neutral-600',
  Pro:        'border border-portfolio-accent bg-white text-portfolio-accent',
  Enterprise: 'border border-neutral-900 bg-white text-neutral-900',
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const stateName = STATE_NAMES[tx.stateCode] ?? tx.stateCode

  return (
    <>
      {tx.triggeredNexus && (
        <div className="px-4 py-2 bg-amber-50 border-y border-amber-200 flex items-center gap-2 text-amber-900 text-xs font-mono font-medium">
          <span>⚡</span>
          <span>Nexus established in {stateName} — tax collection begins</span>
        </div>
      )}
      <div className={`px-4 py-3 border-b border-neutral-900/10 flex items-center gap-3 text-sm font-mono hover:bg-white/60 transition-colors ${tx.triggeredNexus ? 'bg-amber-50/80' : ''}`}>
        <span className="text-neutral-500 text-xs w-14 shrink-0 tabular-nums">
          {formatTimestamp(tx.timestamp)}
        </span>
        <span className="text-neutral-800 truncate flex-1 min-w-0">
          {tx.customerName}
        </span>
        <span className="text-neutral-500 text-xs font-mono w-6 shrink-0">
          {tx.stateCode}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${PLAN_COLORS[tx.plan]}`}>
          {tx.plan}
        </span>
        <span className="text-neutral-800 tabular-nums text-xs w-14 text-right shrink-0">
          {formatCurrency(tx.amount)}
        </span>
        <span className={`tabular-nums text-xs w-14 text-right shrink-0 ${tx.taxAmount > 0 ? 'text-emerald-700' : 'text-neutral-400'}`}>
          {tx.taxAmount > 0 ? formatCurrency(tx.taxAmount) : '—'}
        </span>
      </div>
    </>
  )
}

export function TransactionFeed() {
  const { state } = useSimulation()
  const { transactions, isRunning } = state
  const displayed = transactions.slice(0, 50)

  return (
    <div className="flex flex-col h-full bg-portfolio-sidebar border border-neutral-900 rounded-sm overflow-hidden" data-tour="transaction-feed">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-900/15 flex items-center justify-between shrink-0 bg-portfolio-sidebar">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900 uppercase tracking-[0.08em]">Transactions</span>
          {transactions.length > 0 && (
            <span className="text-xs font-mono text-neutral-500 tabular-nums">
              {transactions.length.toLocaleString()} total
            </span>
          )}
        </div>
        {isRunning && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Column labels */}
      {displayed.length > 0 && (
        <div className="px-4 py-1.5 border-b border-neutral-900/10 flex items-center gap-3 text-xs font-mono text-neutral-500 shrink-0 uppercase tracking-wide">
          <span className="w-14 shrink-0">Time</span>
          <span className="flex-1">Customer</span>
          <span className="w-6 shrink-0">ST</span>
          <span className="w-16 shrink-0">Plan</span>
          <span className="w-14 text-right shrink-0">Sale</span>
          <span className="w-14 text-right shrink-0">Tax</span>
        </div>
      )}

      {/* Rows */}
      <div className="overflow-y-auto flex-1">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2 font-mono">
            <span className="text-2xl">📊</span>
            <span className="text-sm">No transactions yet</span>
          </div>
        ) : (
          displayed.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  )
}

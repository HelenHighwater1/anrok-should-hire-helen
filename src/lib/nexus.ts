import { getNexusDataForState, hasExceededNexusThreshold } from '../data/nexus-data'
import type { Transaction, StateStatus, Filing, FilingStatus } from '../types'

// A sale before tax has been calculated — input to applyTransaction
export type PendingTransaction = Omit<
  Transaction,
  'id' | 'taxAmount' | 'taxRate' | 'nexusWasEstablished' | 'triggeredNexus'
>

export function initialStateStatus(stateCode: string): StateStatus {
  return {
    stateCode,
    revenueInWindow: 0,
    transactionsInWindow: 0,
    nexusEstablished: false,
    nexusTriggeredAt: null,
    totalTaxCollected: 0,
  }
}

/**
 * Core pipeline step: apply one sale to a state's running totals,
 * detect nexus crossing, and calculate tax owed.
 *
 * Tax is collected starting from the transaction that crosses the threshold.
 * In production, Texas's 4-month grace period and other state-specific
 * registration delays would be modeled here before setting nexusEstablished.
 */
export function applyTransaction(
  pending: PendingTransaction,
  stateStatuses: Record<string, StateStatus>
): { transaction: Transaction; updatedStatus: StateStatus } {
  const existing = stateStatuses[pending.stateCode] ?? initialStateStatus(pending.stateCode)

  const revenueInWindow = existing.revenueInWindow + pending.amount
  const transactionsInWindow = existing.transactionsInWindow + 1

  const nexusNowEstablished =
    existing.nexusEstablished ||
    hasExceededNexusThreshold(pending.stateCode, revenueInWindow, transactionsInWindow)

  const nexusJustTriggered = !existing.nexusEstablished && nexusNowEstablished

  const nexusData = getNexusDataForState(pending.stateCode)
  const taxRate = nexusNowEstablished && nexusData ? nexusData.stateTaxRate : 0
  const taxAmount = Math.round(pending.amount * taxRate * 100) / 100

  const updatedStatus: StateStatus = {
    stateCode: pending.stateCode,
    revenueInWindow,
    transactionsInWindow,
    nexusEstablished: nexusNowEstablished,
    nexusTriggeredAt: nexusJustTriggered ? pending.timestamp : existing.nexusTriggeredAt,
    totalTaxCollected: Math.round((existing.totalTaxCollected + taxAmount) * 100) / 100,
  }

  const transaction: Transaction = {
    ...pending,
    id: crypto.randomUUID(),
    taxAmount,
    taxRate,
    nexusWasEstablished: nexusNowEstablished,
    triggeredNexus: nexusJustTriggered,
  }

  return { transaction, updatedStatus }
}

export function getQuarter(date: Date): 1 | 2 | 3 | 4 {
  const month = date.getMonth()
  if (month < 3) return 1
  if (month < 6) return 2
  if (month < 9) return 3
  return 4
}

/**
 * Filing status is based on a 30-day window after quarter end.
 * In production, each state has its own filing deadline (typically
 * 20–30 days after quarter end, sometimes monthly for high-volume filers).
 */
export function getFilingStatus(year: number, quarter: 1 | 2 | 3 | 4): FilingStatus {
  const now = new Date()
  // new Date(year, month, 0) gives the last day of the previous month —
  // so month = quarter * 3 gives us the last day of the quarter-ending month.
  const quarterEnd = new Date(year, quarter * 3, 0)
  const dueDate = new Date(quarterEnd)
  dueDate.setDate(dueDate.getDate() + 30)

  if (now <= quarterEnd) return 'upcoming'
  if (now <= dueDate) return 'due'
  return 'overdue'
}

/**
 * Aggregate all taxable transactions into per-state, per-quarter filing summaries.
 * Only transactions where tax was actually collected contribute to filings.
 */
export function buildFilings(transactions: Transaction[]): Filing[] {
  const groups = new Map<string, Omit<Filing, 'status'>>()

  for (const t of transactions) {
    if (t.taxAmount === 0) continue

    const quarter = getQuarter(t.timestamp)
    const year = t.timestamp.getFullYear()
    const key = `${t.stateCode}-${year}-Q${quarter}`

    const existing = groups.get(key) ?? {
      id: key,
      stateCode: t.stateCode,
      year,
      quarter,
      taxOwed: 0,
      transactionCount: 0,
      revenue: 0,
    }

    groups.set(key, {
      ...existing,
      taxOwed: Math.round((existing.taxOwed + t.taxAmount) * 100) / 100,
      transactionCount: existing.transactionCount + 1,
      revenue: Math.round((existing.revenue + t.amount) * 100) / 100,
    })
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    status: getFilingStatus(group.year, group.quarter),
  }))
}

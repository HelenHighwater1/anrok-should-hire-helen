export type PlanName = 'Starter' | 'Pro' | 'Enterprise'

export interface SaasPlan {
  name: PlanName
  monthlyPrice: number
}

export const SAAS_PLANS: SaasPlan[] = [
  { name: 'Starter', monthlyPrice: 299 },
  { name: 'Pro', monthlyPrice: 999 },
  { name: 'Enterprise', monthlyPrice: 2999 },
]

export interface Transaction {
  id: string
  timestamp: Date
  customerName: string
  stateCode: string
  plan: PlanName
  amount: number        // gross sale amount in USD
  taxAmount: number     // 0 if nexus not established at time of sale
  taxRate: number       // 0 if nexus not established at time of sale
  nexusWasEstablished: boolean // snapshot: was nexus live when this sale occurred?
  triggeredNexus: boolean      // true only for the transaction that crossed the threshold
}

export interface StateStatus {
  stateCode: string
  revenueInWindow: number       // cumulative revenue counted toward threshold
  transactionsInWindow: number  // cumulative transaction count toward threshold
  nexusEstablished: boolean
  nexusTriggeredAt: Date | null
  totalTaxCollected: number
}

export type FilingStatus = 'upcoming' | 'due' | 'overdue' | 'filed'

export interface Filing {
  id: string
  stateCode: string
  year: number
  quarter: 1 | 2 | 3 | 4
  taxOwed: number
  transactionCount: number
  revenue: number
  status: FilingStatus
}

export interface SimulationState {
  transactions: Transaction[]
  stateStatuses: Record<string, StateStatus>
  filings: Filing[]
  isRunning: boolean
  ticksPerSecond: number
}

import { SAAS_PLANS, type PlanName, type SimulationState, type StateStatus, type Transaction } from '../types'
import { applyTransaction, buildFilings } from './nexus'
import type { PendingTransaction } from './nexus'

// ─── Customer Names Pool ─────────────────────────────────────────────────────

const CUSTOMER_NAMES = [
  'Acme Systems', 'Brightwave', 'Cascade Data', 'Driftwood Analytics',
  'Emberstone Corp', 'Fieldgate Tech', 'Granite Software', 'Horizon Labs',
  'Ironfield Digital', 'Juniper Cloud', 'Keystone AI', 'Lakewood Systems',
  'Meridian Tech', 'Northgate Solutions', 'Oakdale Software', 'Pinnacle Data',
  'Quarry Analytics', 'Ridgeline Corp', 'Silvergate Tech', 'Thornwood Digital',
  'Upland Systems', 'Vantage Software', 'Westbrook AI', 'Xelerate Corp',
  'Yellowstone Tech', 'Zenith Platforms',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedRandom<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item.value
  }
  return items[items.length - 1].value
}

function planAmount(plan: PlanName): number {
  return SAAS_PLANS.find((p) => p.name === plan)!.monthlyPrice
}

function randomTimestampInMonth(year: number, month: number): Date {
  const start = new Date(year, month, 1).getTime()
  const end = new Date(year, month + 1, 0).getTime()
  return new Date(start + Math.random() * (end - start))
}

function makePlans(starter: number, pro: number, enterprise: number): PlanName[] {
  return [
    ...Array<PlanName>(starter).fill('Starter'),
    ...Array<PlanName>(pro).fill('Pro'),
    ...Array<PlanName>(enterprise).fill('Enterprise'),
  ]
}

// ─── Seed config (single demo: "Series A" style) ─────────────────────────────

interface CustomerGroup {
  stateCode: string
  plans: PlanName[]
}

interface SeedConfig {
  startYear: number
  startMonth: number // 0-indexed
  months: number
  // Pre-computed totals representing revenue before the generated window.
  // Lets us show meaningful state progress without replaying years of history.
  baseline: Record<string, Omit<StateStatus, 'stateCode'>>
  customers: CustomerGroup[]
}

/** Historical totals + customer mix for the default demo (Series A narrative). */
const DEFAULT_SEED_CONFIG: SeedConfig = {
  startYear: 2025,
  startMonth: 9, // Oct 2025
  months: 6,
  // Historical totals (Oct 2024 – Sep 2025).
  // FL crosses $100k during seeding (month 1). WA/IL/GA/MA are seeded just
  // below threshold so they tip within seconds of hitting Play.
  baseline: {
    CA: { revenueInWindow: 120000, transactionsInWindow: 150, nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    TX: { revenueInWindow: 88000,  transactionsInWindow: 110, nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    NY: { revenueInWindow: 95000,  transactionsInWindow: 119, nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    FL: { revenueInWindow: 96500,  transactionsInWindow: 121, nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    WA: { revenueInWindow: 8500,   transactionsInWindow: 11,  nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    IL: { revenueInWindow: 10000,  transactionsInWindow: 13,  nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    GA: { revenueInWindow: 11000,  transactionsInWindow: 14,  nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    MA: { revenueInWindow: 15500,  transactionsInWindow: 20,  nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    CO: { revenueInWindow: 35000,  transactionsInWindow: 44,  nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
    AZ: { revenueInWindow: 28000,  transactionsInWindow: 35,  nexusEstablished: false, nexusTriggeredAt: null, totalTaxCollected: 0 },
  },
  customers: [
    { stateCode: 'CA', plans: makePlans(18, 9, 3) },
    { stateCode: 'TX', plans: makePlans(15, 5, 2) },
    { stateCode: 'NY', plans: makePlans(15, 8, 2) },
    { stateCode: 'FL', plans: makePlans(10, 8, 2) },
    { stateCode: 'WA', plans: makePlans(10, 6, 2) },
    { stateCode: 'IL', plans: makePlans(9,  5, 2) },
    { stateCode: 'GA', plans: makePlans(8,  4, 2) },
    { stateCode: 'MA', plans: makePlans(7,  4, 1) },
    { stateCode: 'CO', plans: makePlans(7,  2, 1) },
    { stateCode: 'AZ', plans: makePlans(5,  2, 1) },
  ],
}

// ─── Seed Function ───────────────────────────────────────────────────────────

export function seedInitialState(): SimulationState {
  const config = DEFAULT_SEED_CONFIG

  let stateStatuses: Record<string, StateStatus> = {}
  for (const [code, baseline] of Object.entries(config.baseline)) {
    stateStatuses[code] = { stateCode: code, ...baseline }
  }

  const transactions: Transaction[] = []

  for (let m = 0; m < config.months; m++) {
    const date = new Date(config.startYear, config.startMonth + m)
    const year = date.getFullYear()
    const month = date.getMonth()

    for (const group of config.customers) {
      for (const plan of group.plans) {
        const pending: PendingTransaction = {
          timestamp: randomTimestampInMonth(year, month),
          customerName: randomFrom(CUSTOMER_NAMES),
          stateCode: group.stateCode,
          plan,
          amount: planAmount(plan),
        }
        const { transaction, updatedStatus } = applyTransaction(pending, stateStatuses)
        stateStatuses = { ...stateStatuses, [group.stateCode]: updatedStatus }
        transactions.push(transaction)
      }
    }
  }

  transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return {
    transactions,
    stateStatuses,
    filings: buildFilings(transactions),
    isRunning: false,
    ticksPerSecond: 1,
  }
}

// ─── Live Transaction Generator ──────────────────────────────────────────────

const LIVE_STATE_WEIGHTS = [
  { value: 'CA', weight: 15 },
  { value: 'TX', weight: 10 },
  { value: 'NY', weight: 10 },
  { value: 'FL', weight: 8  },
  { value: 'WA', weight: 7  },
  { value: 'IL', weight: 6  },
  { value: 'GA', weight: 5  },
  { value: 'MA', weight: 5  },
  { value: 'CO', weight: 4  },
  { value: 'AZ', weight: 4  },
]

const LIVE_PLAN_WEIGHTS = [
  { value: 'Starter'    as PlanName, weight: 50 },
  { value: 'Pro'        as PlanName, weight: 35 },
  { value: 'Enterprise' as PlanName, weight: 15 },
]

export function generateTransaction(): PendingTransaction {
  const plan = weightedRandom(LIVE_PLAN_WEIGHTS)
  return {
    timestamp: new Date(),
    customerName: randomFrom(CUSTOMER_NAMES),
    stateCode: weightedRandom(LIVE_STATE_WEIGHTS),
    plan,
    amount: planAmount(plan),
  }
}

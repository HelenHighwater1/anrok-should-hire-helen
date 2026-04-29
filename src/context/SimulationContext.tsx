import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { applyTransaction, buildFilings } from '../lib/nexus'
import type { SimulationState } from '../types'
import type { PendingTransaction } from '../lib/nexus'

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SEED'; seededState: SimulationState }
  | { type: 'ADD_TRANSACTION'; pending: PendingTransaction }
  | { type: 'TOGGLE_RUNNING' }
  | { type: 'SET_SPEED'; ticksPerSecond: number }
  | { type: 'RESET' }

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: SimulationState = {
  transactions: [],
  stateStatuses: {},
  filings: [],
  isRunning: false,
  ticksPerSecond: 1,
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case 'SEED':
      return action.seededState

    case 'ADD_TRANSACTION': {
      const { transaction, updatedStatus } = applyTransaction(
        action.pending,
        state.stateStatuses
      )
      const transactions = [transaction, ...state.transactions]
      const stateStatuses = { ...state.stateStatuses, [transaction.stateCode]: updatedStatus }
      const filings = buildFilings(transactions)
      return { ...state, transactions, stateStatuses, filings }
    }

    case 'TOGGLE_RUNNING':
      return { ...state, isRunning: !state.isRunning }

    case 'SET_SPEED':
      return { ...state, ticksPerSecond: action.ticksPerSecond }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface SimulationContextValue {
  state: SimulationState
  seed: (seededState: SimulationState) => void
  addTransaction: (pending: PendingTransaction) => void
  toggleRunning: () => void
  setSpeed: (ticksPerSecond: number) => void
  reset: () => void
}

const SimulationContext = createContext<SimulationContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const value: SimulationContextValue = {
    state,
    seed: (seededState) => dispatch({ type: 'SEED', seededState }),
    addTransaction: (pending) => dispatch({ type: 'ADD_TRANSACTION', pending }),
    toggleRunning: () => dispatch({ type: 'TOGGLE_RUNNING' }),
    setSpeed: (ticksPerSecond) => dispatch({ type: 'SET_SPEED', ticksPerSecond }),
    reset: () => dispatch({ type: 'RESET' }),
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/** Co-located hook for the provider; Fast Refresh expects only components in this file. */
// eslint-disable-next-line react-refresh/only-export-components -- hook is tied to SimulationProvider
export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider')
  return ctx
}

import { useEffect, useRef, useState } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { getNexusDataForState } from '../data/nexus-data'

const STATE_NAMES: Record<string, string> = {
  CA: 'California', TX: 'Texas', NY: 'New York', FL: 'Florida',
  WA: 'Washington', IL: 'Illinois', GA: 'Georgia', MA: 'Massachusetts',
  CO: 'Colorado', AZ: 'Arizona',
}

interface Toast {
  id: string
  stateCode: string
  taxRate: number
}

export function NexusToastContainer() {
  const { state } = useSimulation()
  const [toasts, setToasts] = useState<Toast[]>([])
  const lastSeenId = useRef<string | null>(null)

  useEffect(() => {
    const latest = state.transactions[0]
    if (!latest?.triggeredNexus) return
    if (latest.id === lastSeenId.current) return
    lastSeenId.current = latest.id

    const nexusData = getNexusDataForState(latest.stateCode)
    const toast: Toast = {
      id: latest.id,
      stateCode: latest.stateCode,
      taxRate: nexusData?.stateTaxRate ?? 0,
    }

    setToasts((prev) => [...prev, toast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id))
    }, 5000)
  }, [state.transactions])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:bottom-6 sm:left-6 sm:right-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-enter flex items-start gap-3 bg-white border border-neutral-900 rounded-sm px-4 py-3 shadow-[3px_3px_0_0_rgba(23,23,23,0.1)] w-full sm:w-72"
        >
          <span className="text-xl shrink-0 mt-0.5">⚡</span>
          <div>
            <div className="text-neutral-900 font-semibold text-sm font-sans">
              Nexus established in {STATE_NAMES[toast.stateCode] ?? toast.stateCode}
            </div>
            <div className="text-neutral-600 text-xs mt-0.5 font-mono">
              {(toast.taxRate * 100).toFixed(2)}% tax rate now applies to all sales
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

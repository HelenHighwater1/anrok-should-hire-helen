import { useEffect } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { generateTransaction } from '../lib/simulation'

export function useSimulationRunner() {
  const { state, addTransaction } = useSimulation()
  const { isRunning, ticksPerSecond } = state

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      addTransaction(generateTransaction())
    }, 1000 / ticksPerSecond)
    return () => clearInterval(interval)
  }, [isRunning, ticksPerSecond, addTransaction])
}

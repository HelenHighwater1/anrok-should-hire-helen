import { useEffect, useState } from 'react'
import { useSimulation } from './context/SimulationContext'
import { useSimulationRunner } from './hooks/useSimulationRunner'
import { seedInitialState } from './lib/simulation'
import { TransactionFeed } from './components/TransactionFeed'
import { NexusMap } from './components/NexusMap'
import { FilingPanel } from './components/FilingPanel'
import { SpotlightTour } from './components/SpotlightTour'
import { NexusToastContainer } from './components/NexusToast'

const SPEED_OPTIONS = [1, 2, 5, 10, 20]

const REPO_URL = 'https://github.com/HelenHighwater1/anrok-should-hire-helen#hey-anrok-team'

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onReplayTour }: { onReplayTour?: () => void }) {
  return (
    <header className="flex flex-wrap items-center gap-4 lg:gap-6 px-4 lg:px-6 py-3 border-b border-neutral-900/15 shrink-0 bg-white">
      <div className="flex items-center gap-4 shrink-0 min-w-0">
        <span className="inline-flex items-center gap-x-2 flex-wrap text-sm font-semibold text-neutral-900 uppercase tracking-[0.14em]">
          <span className="leading-none">Built for</span>
          <span className="text-lg sm:text-xl font-bold leading-none tracking-[0.12em] text-white [-webkit-text-stroke:1.75px_#171717] [paint-order:stroke_fill]">
            Anrok
          </span>
          <span className="leading-none">by Helen</span>
        </span>
        <a
          href="https://heyimhelen.com"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-sm font-mono text-portfolio-accent hover:opacity-80 transition-opacity shrink-0"
        >
          heyimhelen.com
        </a>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wide"
        >
          GitHub
        </a>
        <button
          type="button"
          onClick={onReplayTour}
          className="cursor-pointer text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wide"
        >
          Tour
        </button>
      </div>
    </header>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { state, toggleRunning, setSpeed } = useSimulation()
  const { isRunning, ticksPerSecond, stateStatuses } = state

  const nexusCount = Object.values(stateStatuses).filter((s) => s.nexusEstablished).length

  return (
    <div className="flex flex-col flex-1 lg:min-h-0 lg:overflow-hidden">
      {/* Toolbar — tour spotlights only the speed + Play/Pause group (see data-tour below) */}
      <div className="flex flex-wrap items-center gap-3 lg:gap-4 px-4 lg:px-6 py-2.5 border-b border-neutral-900/15 bg-portfolio-sidebar shrink-0">
        <span className="text-xs mr-auto w-full sm:w-auto sm:mr-auto font-mono">
          <span className="font-semibold text-neutral-900 tracking-wide uppercase text-[11px]">Exemptify Sales</span>
          <span className="hidden sm:inline">
            <span className="text-neutral-400"> : </span>
            <span className="font-semibold text-neutral-900 tabular-nums">{nexusCount}</span>
            <span className="text-neutral-500">
              {' '}
              {nexusCount === 1 ? 'state' : 'states'} in Nexus
            </span>
          </span>
        </span>

        <div className="flex items-center gap-3 lg:gap-4" data-tour="sim-controls">
          {/* Speed picker */}
          <div className="flex items-center gap-0.5 bg-white rounded-sm p-1 border border-neutral-900">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`cursor-pointer px-2 sm:px-3 py-1 rounded-sm text-xs font-mono font-medium transition-colors ${
                  ticksPerSecond === s
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={toggleRunning}
            className={`cursor-pointer px-4 py-1.5 rounded-sm text-xs font-mono font-medium border border-neutral-900 transition-colors ${
              isRunning
                ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                : 'bg-portfolio-accent text-white hover:opacity-90'
            }`}
          >
            {isRunning ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="app-pattern flex flex-col lg:flex-row flex-1 min-h-0 lg:overflow-hidden gap-4 p-4 lg:p-6">
        <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
          <NexusMap />
          <FilingPanel />
        </div>
        <div className="w-full lg:w-96 shrink-0 h-[28rem] lg:h-auto min-h-0">
          <TransactionFeed />
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  useSimulationRunner()

  const { state, seed, toggleRunning, setSpeed } = useSimulation()
  const [showTour, setShowTour] = useState(true)

  useEffect(() => {
    seed(seedInitialState())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTourDone() {
    setShowTour(false)
    setSpeed(2)
    if (!state.isRunning) toggleRunning()
  }

  return (
    <div className="min-h-screen lg:h-screen bg-white text-neutral-900 flex flex-col lg:overflow-hidden font-sans antialiased">
      <Header onReplayTour={() => setShowTour(true)} />
      <Dashboard />
      {showTour && <SpotlightTour onDone={handleTourDone} />}
      <NexusToastContainer />
    </div>
  )
}

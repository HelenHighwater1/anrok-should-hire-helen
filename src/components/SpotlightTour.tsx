import { useEffect, useLayoutEffect, useState } from 'react'

const PADDING = 8

interface Step {
  target: string | null
  placement: 'center' | 'right' | 'left' | 'top'
  icon: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    target: null,
    placement: 'center',
    icon: '🧾',
    title: 'Welcome, Anrok Team, to my demo app!',
    body: "This demo shows Exemptify - a fictional SaaS company selling subscriptions to businesses nationwide. Sales here are simulated, but economic nexus thresholds and state base tax rates are real. As transactions accumulate, the app tracks exposure state by state, surfaces the moment nexus kicks in, estimates tax on new sales, and builds quarterly filing obligations - a small slice of what Anrok does for customers every day.",
  },
  {
    target: 'nexus-map',
    placement: 'right',
    icon: '🗺️',
    title: 'The Nexus Map',
    body: "States change color as revenue builds, and flash red the moment you cross the economic nexus threshold — the point where you're legally required to collect and remit sales tax.",
  },
  {
    target: 'transaction-feed',
    placement: 'left',
    icon: '⚡',
    title: 'Live Transaction Feed',
    body: "Every sale appears here as it happens. Amber banners mark the exact moment nexus is established in a new state.",
  },
  {
    target: 'sim-controls',
    placement: 'top',
    icon: '⏱️',
    title: 'Speed and playback',
    body: 'Use 1x–20x to control how fast simulated sales arrive. Play starts the feed; Pause freezes everything so you can read a state or filing row without missing data.',
  },
  {
    target: 'filing-panel',
    placement: 'top',
    icon: '📋',
    title: 'Filing Obligations',
    body: "Once nexus is established, quarterly tax obligations appear here — real thresholds, real state rates, real filing windows — calculated automatically from every transaction.",
  },
]

function useElementRect(target: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)
  useLayoutEffect(() => {
    if (!target) { setRect(null); return }
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [target])
  return rect
}

function cardStyle(): React.CSSProperties {
  return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
}

export function SpotlightTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const rect = useElementRect(current.target)
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  const sr = rect
    ? { x: rect.x - PADDING, y: rect.y - PADDING, w: rect.width + PADDING * 2, h: rect.height + PADDING * 2 }
    : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDone()
      if (e.key === 'ArrowRight') isLast ? onDone() : setStep(s => s + 1)
      if (e.key === 'ArrowLeft' && !isFirst) setStep(s => s - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFirst, isLast, onDone])

  const ease = '400ms cubic-bezier(0.4,0,0.2,1)'
  /* Only geometry transitions — rim glow is CSS keyframes on box-shadow. */
  const rectTransition = { transition: `left ${ease}, top ${ease}, width ${ease}, height ${ease}` }

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>

      {/* SVG dim + spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {sr && <rect x={sr.x} y={sr.y} width={sr.w} height={sr.h} rx={12} fill="black" style={rectTransition} />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(23,23,23,0.45)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Glow rim — HTML div so box-shadow isn't clipped by SVG viewport */}
      {sr && (
        <div
          className="absolute spotlight-rim"
          style={{
            left: sr.x, top: sr.y, width: sr.w, height: sr.h,
            borderRadius: 12,
            ...rectTransition,
          }}
        />
      )}

      {/* Tour card — fixed footprint so controls never shift between steps */}
      <div
        role="dialog"
        aria-labelledby="tour-title"
        className="absolute w-[min(32rem,calc(100vw-2rem))] h-[min(26rem,calc(100vh-6rem))] max-h-[28rem]"
        style={{ ...cardStyle(), pointerEvents: 'auto' }}
      >
        <div className="bg-white border-2 border-neutral-900 rounded-sm p-6 shadow-[4px_4px_0_0_rgba(23,23,23,0.12)] h-full flex flex-col min-h-0">

          {/* Progress pips + skip */}
          <div className="flex items-center justify-between gap-3 shrink-0 mb-5">
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <div key={i} className="flex h-1 w-5 items-center justify-center">
                  <div
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 20 : 6,
                      backgroundColor: i === step ? '#3d5a80' : i < step ? '#1e293b' : '#d4d4d4',
                    }}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={onDone} className="text-xs font-mono text-neutral-500 hover:text-neutral-900 uppercase tracking-wide transition-colors shrink-0">
              Skip
            </button>
          </div>

          <div className="text-3xl mb-3 shrink-0 select-none leading-none">{current.icon}</div>
          <h2 id="tour-title" className="text-base font-semibold text-neutral-900 mb-2 tracking-tight shrink-0 min-h-[3.75rem] max-h-[3.75rem] leading-snug line-clamp-3 overflow-hidden">
            {current.title}
          </h2>
          <p className="text-neutral-600 text-xs leading-relaxed font-mono flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
            {current.body}
          </p>

          <div className="mt-auto grid shrink-0 grid-cols-[minmax(4.5rem,auto)_1fr] items-center gap-2 pt-3">
            {isFirst ? (
              <span className="invisible px-3 py-1.5 text-xs font-mono" aria-hidden>
                ← Back
              </span>
            ) : (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="justify-self-start px-3 py-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors">
                ← Back
              </button>
            )}
            <button
              type="button"
              autoFocus
              onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
              className="justify-self-end min-w-[7.5rem] px-5 py-1.5 rounded-sm text-xs font-mono font-medium bg-[#3d5a80] text-white border border-neutral-900 hover:opacity-90 transition-opacity text-center"
            >
              {isLast ? 'Get started' : 'Next →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

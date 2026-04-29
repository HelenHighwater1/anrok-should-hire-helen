import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useSimulation } from '../context/SimulationContext'
import { getNexusDataForState, NO_SALES_TAX_STATES } from '../data/nexus-data'
import type { StateStatus } from '../types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

/** SVG pattern id (single map on page) — white / grey diagonal stripes for no–sales-tax states. */
const NO_TAX_STRIPE_PATTERN_ID = 'no-sales-tax-stripes'
const NO_TAX_FILL = `url(#${NO_TAX_STRIPE_PATTERN_ID})`

const NO_TAX_CODES = new Set(NO_SALES_TAX_STATES.map((s) => s.code))

// Full name → 2-letter code mapping (us-atlas stores full names in properties)
const NAME_TO_CODE: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR',
  California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID',
  Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY',
}

// ─── Color Logic ─────────────────────────────────────────────────────────────

function getStateFill(code: string, statuses: Record<string, StateStatus>): string {
  if (!code) return '#d1d5db'
  if (NO_TAX_CODES.has(code)) return NO_TAX_FILL

  const status = statuses[code]
  if (!status) return '#e5e7eb'
  if (status.nexusEstablished) return '#dc2626'

  const nexusData = getNexusDataForState(code)
  if (!nexusData) return '#e5e7eb'

  const pct = status.revenueInWindow / nexusData.revenueThreshold
  if (pct >= 0.75) return '#f97316'
  if (pct >= 0.5) return '#2563eb'
  if (pct >= 0.1) return '#60a5fa'
  return '#e5e7eb'
}

function getStateStroke(code: string, statuses: Record<string, StateStatus>, hovered: boolean): string {
  if (hovered) return '#0f172a'
  if (NO_TAX_CODES.has(code)) return '#6b7280'
  const status = statuses[code]
  if (status?.nexusEstablished) return '#7f1d1d'
  return '#1e293b'
}

// ─── Glow Class ──────────────────────────────────────────────────────────────

function getGlowClass(code: string, statuses: Record<string, StateStatus>): string | undefined {
  if (NO_TAX_CODES.has(code)) return undefined
  const status = statuses[code]
  if (!status) return undefined
  if (status.nexusEstablished) return 'nexus-glow-established'

  const nexusData = getNexusDataForState(code)
  if (!nexusData) return undefined
  const pct = status.revenueInWindow / nexusData.revenueThreshold
  if (pct >= 0.85) return 'nexus-glow-approach-strong'
  if (pct >= 0.6) return 'nexus-glow-approach-soft'
  return undefined
}

// ─── In-State Label (inline SVG) ─────────────────────────────────────────────

/** Revenue only, short form: `12k`, `1.2M` (no state code, no $). */
function revenueSoldShortK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  if (n > 0) return `${Math.round(n)}`
  return '0'
}

function StateLabel({ status, x, y }: { status: StateStatus; x: number; y: number }) {
  const label = revenueSoldShortK(status.revenueInWindow)
  const fill = status.nexusEstablished ? '#991b1b' : '#0f172a'
  return (
    <g transform={`translate(${x}, ${y})`} pointerEvents="none">
      <rect
        x={-26}
        y={-12}
        width={52}
        height={24}
        rx={2}
        fill="#ffffff"
        stroke="#171717"
        strokeWidth={1}
      />
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        y={0}
        fontSize={11}
        fontWeight={600}
        fill={fill}
        fontFamily="'IBM Plex Mono', ui-monospace, monospace"
      >
        {label}
      </text>
    </g>
  )
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipData {
  code: string
  name: string
  x: number
  y: number
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toLocaleString()}`
}

function TooltipPanel({ code, name, x, y, statuses }: TooltipData & { statuses: Record<string, StateStatus> }) {
  const status = statuses[code]
  const nexusData = getNexusDataForState(code)
  const isNoTax = NO_TAX_CODES.has(code)

  const left = x + 12
  const top = y - 8

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left, top }}
    >
      <div className="bg-white border border-neutral-900 rounded-sm p-3 shadow-[3px_3px_0_0_rgba(23,23,23,0.08)] w-56 text-xs font-mono">
        {/* State name + code */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-neutral-900 text-sm font-sans tracking-tight">{name}</span>
          <span className="text-neutral-500 font-mono">{code}</span>
        </div>

        {isNoTax ? (
          <span className="text-neutral-500">No state sales tax</span>
        ) : !status ? (
          <span className="text-neutral-500">No sales recorded</span>
        ) : (
          <>
            {/* Nexus status badge */}
            <div className="mb-2">
              {status.nexusEstablished ? (
                <span className="text-xs px-2 py-0.5 rounded-sm border border-red-700 bg-red-50 text-red-800 font-medium">
                  ⚡ Nexus established
                </span>
              ) : nexusData && (status.revenueInWindow / nexusData.revenueThreshold) >= 0.75 ? (
                <span className="text-xs px-2 py-0.5 rounded-sm border border-amber-600 bg-amber-50 text-amber-900 font-medium">
                  ⚠ Approaching threshold
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-sm border border-neutral-300 bg-neutral-50 text-neutral-600 font-medium">
                  Tracking
                </span>
              )}
            </div>

            {nexusData && (
              <>
                {/* Revenue progress */}
                <div className="mb-1.5">
                  <div className="flex justify-between text-neutral-500 mb-1">
                    <span>Revenue</span>
                    <span>
                      {formatCurrency(status.revenueInWindow)} / {formatCurrency(nexusData.revenueThreshold)}
                    </span>
                  </div>
                  <div className="h-1 bg-neutral-200 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm transition-all ${status.nexusEstablished ? 'bg-red-600' : 'bg-[#3d5a80]'}`}
                      style={{ width: `${Math.min(100, (status.revenueInWindow / nexusData.revenueThreshold) * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>

                {/* Transaction threshold (if applicable) */}
                {nexusData.transactionThreshold !== null && (
                  <div className="text-neutral-500">
                    Transactions: {status.transactionsInWindow.toLocaleString()} / {nexusData.transactionThreshold.toLocaleString()}
                    {nexusData.transactionThresholdType && (
                      <span className="text-neutral-400 ml-1">({nexusData.transactionThresholdType.toUpperCase()} test)</span>
                    )}
                  </div>
                )}

                {/* Tax info */}
                {status.nexusEstablished && (
                  <div className="mt-2 pt-2 border-t border-neutral-200 text-neutral-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Tax rate</span>
                      <span className="text-neutral-900">{(nexusData.stateTaxRate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax collected</span>
                      <span className="text-emerald-700">{formatCurrency(status.totalTaxCollected)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

type LegendItem =
  | { kind: 'solid'; color: string; label: string }
  | { kind: 'stripes'; label: string }

const LEGEND_ITEMS: LegendItem[] = [
  { kind: 'solid', color: '#dc2626', label: 'Nexus established' },
  { kind: 'solid', color: '#f97316', label: 'Approaching (75%+)' },
  { kind: 'solid', color: '#2563eb', label: 'Tracking' },
  { kind: 'solid', color: '#e5e7eb', label: 'No sales' },
  { kind: 'stripes', label: 'No sales tax' },
]

function LegendSwatch({ item }: { item: LegendItem }) {
  if (item.kind === 'stripes') {
    return (
      <div
        className="w-3 h-3 shrink-0 rounded-sm border border-neutral-900/30"
        style={{
          backgroundImage: 'repeating-linear-gradient(-45deg, #ffffff, #ffffff 2px, #d1d5db 2px, #d1d5db 4px)',
        }}
      />
    )
  }
  return (
    <div
      className="w-3 h-3 shrink-0 rounded-sm border border-neutral-900/30"
      style={{ backgroundColor: item.color }}
    />
  )
}

function Legend() {
  return (
    <div className="static shrink-0 border-t border-neutral-900/10 bg-white/95 p-3 lg:absolute lg:bottom-4 lg:left-4 lg:z-10 lg:border-t-0 lg:bg-white/90 lg:backdrop-blur-[2px] lg:p-2 lg:rounded-sm lg:border lg:border-neutral-900/15 flex items-center gap-3 flex-wrap">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <LegendSwatch item={item} />
          <span className="text-neutral-500 text-xs font-mono">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NexusMap() {
  const { state } = useSimulation()
  const { stateStatuses } = state
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const [flashingCodes, setFlashingCodes] = useState<Set<string>>(new Set())
  const lastSeenId = useRef<string | null>(null)
  /** Skip the first document pointerdown after opening tooltip (same gesture as tap-to-show). */
  const skipNextDocumentPointerDown = useRef(false)

  useEffect(() => {
    const latest = state.transactions[0]
    if (!latest?.triggeredNexus) return
    if (latest.id === lastSeenId.current) return
    lastSeenId.current = latest.id

    setFlashingCodes((prev) => new Set(prev).add(latest.stateCode))
    setTimeout(() => {
      setFlashingCodes((prev) => {
        const next = new Set(prev)
        next.delete(latest.stateCode)
        return next
      })
    }, 1800)
  }, [state.transactions])

  // Dismiss tooltip on a subsequent tap outside the opening gesture (touch / pen / mouse).
  useEffect(() => {
    if (!tooltip) return

    function onDocumentPointerDown() {
      if (skipNextDocumentPointerDown.current) {
        skipNextDocumentPointerDown.current = false
        return
      }
      setHoveredCode(null)
      setTooltip(null)
    }

    document.addEventListener('pointerdown', onDocumentPointerDown)
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown)
  }, [tooltip])

  return (
    <div
      className="relative flex-1 flex flex-col min-h-0 bg-white overflow-hidden rounded-sm border border-neutral-900"
      data-tour="nexus-map"
    >
      <div className="relative w-full aspect-[5/3] lg:flex-1 lg:aspect-auto lg:min-h-0 shrink-0 lg:shrink min-h-0">
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <pattern
              id={NO_TAX_STRIPE_PATTERN_ID}
              patternUnits="userSpaceOnUse"
              width={10}
              height={10}
            >
              <rect width={10} height={10} fill="#ffffff" />
              <path
                d="M0 10 L10 0 M-2.5 2.5 L2.5 -2.5 M7.5 12.5 L12.5 7.5"
                stroke="#c4c4c8"
                strokeWidth={2.25}
                strokeLinecap="square"
              />
            </pattern>
          </defs>
        <Geographies geography={GEO_URL}>
          {({ geographies, path }) => (
            <>
              {geographies.map((geo) => {
                const name: string = geo.properties.name
                const code = NAME_TO_CODE[name]
                if (!code) return null

                const isFlashing = flashingCodes.has(code)
                const fill = isFlashing ? '#fbbf24' : getStateFill(code, stateStatuses)
                const stroke = getStateStroke(code, stateStatuses, hoveredCode === code)
                const glowClass = isFlashing ? undefined : getGlowClass(code, stateStatuses)
                const className = isFlashing
                  ? 'nexus-flash'
                  : glowClass

                return (
                  <Geography
                    key={`${geo.rsmKey}-${isFlashing}`}
                    geography={geo}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={0.75}
                    className={className}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                    onPointerEnter={(evt: ReactPointerEvent<SVGPathElement>) => {
                      setHoveredCode(code)
                      setTooltip({ code, name, x: evt.clientX, y: evt.clientY })
                      if (evt.pointerType === 'touch' || evt.pointerType === 'pen') {
                        skipNextDocumentPointerDown.current = true
                      }
                    }}
                    onPointerMove={(evt: ReactPointerEvent<SVGPathElement>) => {
                      setTooltip((prev) => (prev ? { ...prev, x: evt.clientX, y: evt.clientY } : prev))
                    }}
                    onPointerLeave={() => {
                      setHoveredCode(null)
                      setTooltip(null)
                    }}
                  />
                )
              })}
              {geographies.map((geo) => {
                const name: string = geo.properties.name
                const code = NAME_TO_CODE[name]
                if (!code) return null
                const status = stateStatuses[code]
                if (!status || status.revenueInWindow <= 0 || NO_TAX_CODES.has(code)) return null
                const [x, y] = path.centroid(geo)
                return (
                  <StateLabel key={`l-${code}`} status={status} x={x} y={y} />
                )
              })}
            </>
          )}
        </Geographies>
        </ComposableMap>
      </div>

      <Legend />

      {tooltip && (
        <TooltipPanel {...tooltip} statuses={stateStatuses} />
      )}
    </div>
  )
}

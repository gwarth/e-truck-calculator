import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts'
import type { SimResult, TimelineSegment } from '../../types'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { generateChartData, CHART_MAX_HOURS } from '../../utils/drivingSimulator'

interface Props {
  results: SimResult[]
  targetKm: number
  minSocPct: number
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function hhmm(h: number) {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${hours}:${mins.toString().padStart(2, '0')} h`
}

const STATUS_CONFIG = {
  ok: {
    Icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    label: () => 'Ohne Extra-Ladestopp machbar',
  },
  'extra-stop': {
    Icon: AlertTriangle,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    label: (stops: number, mins: number) =>
      `${stops} Extra-Ladestopp${stops > 1 ? 's' : ''} (+${mins} min)`,
  },
  'not-feasible': {
    Icon: XCircle,
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    label: () => 'Tour nicht in Tageslenkzeit schaffbar',
  },
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length || payload[0].value == null) return null
  const t = Number(label)
  const soc = Number(payload[0].value)
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <div className="text-slate-500">{hhmm(t)}</div>
      <div className="font-semibold text-blue-700">{soc.toFixed(1)} % SOC</div>
    </div>
  )
}

// ─── Segment-Legende für ein Fahrzeug ────────────────────────────────────────

function SegmentBadges({ segments }: { segments: TimelineSegment[] }) {
  const charging = segments.filter(s => s.type === 'charging')
  const extra = segments.filter(s => s.type === 'extra_stop')

  if (charging.length === 0 && extra.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {charging.map((s, i) => (
        <span key={`c${i}`} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          ✅ Pflichtpause: +{Math.round((s.endSoc - s.startSoc))}% SOC ({Math.round((s.endH - s.startH) * 60)} min)
        </span>
      ))}
      {extra.map((s, i) => (
        <span key={`e${i}`} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          ⚠️ Extra-Stopp bei {Math.round(s.startKm)} km · {Math.round((s.endH - s.startH) * 60)} min
        </span>
      ))}
    </div>
  )
}

// ─── Einzelnes Fahrzeug-Chart ─────────────────────────────────────────────────

function VehicleChart({ result, minSocPct }: { result: SimResult; minSocPct: number }) {
  const cfg = STATUS_CONFIG[result.statusLabel]
  const { Icon } = cfg

  const chartData = generateChartData(result.segments, CHART_MAX_HOURS)

  // Zonen für ReferenceArea
  const breakZones = result.segments
    .filter(s => s.type === 'charging' || s.type === 'break_idle')
    .reduce<Array<{ x1: number; x2: number }>>((acc, seg) => {
      // Merge benachbarte Pause-Segmente zu einer Zone
      const last = acc[acc.length - 1]
      if (last && Math.abs(last.x2 - seg.startH) < 0.01) {
        last.x2 = seg.endH
      } else {
        acc.push({ x1: seg.startH, x2: seg.endH })
      }
      return acc
    }, [])

  const extraZones = result.segments
    .filter(s => s.type === 'extra_stop')
    .map(s => ({ x1: s.startH, x2: s.endH }))

  const xTicks = Array.from({ length: Math.floor(CHART_MAX_HOURS / 2) + 1 }, (_, i) => i * 2)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-slate-800">{result.vehicleName}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {result.feasible
              ? `Ankunft nach ${hhmm(result.totalTimeH)} · ${result.segments.filter(s => s.type === 'charging' || s.type === 'extra_stop').length} Ladevorgang${result.segments.filter(s => s.type === 'charging' || s.type === 'extra_stop').length !== 1 ? 'gänge' : ''}`
              : 'Ziel nicht innerhalb Tageslenkzeit erreichbar'
            }
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${cfg.bg} ${cfg.color} shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
          <span>
            {result.statusLabel === 'extra-stop'
              ? STATUS_CONFIG['extra-stop'].label(result.extraChargingStops, result.extraChargingMinutes)
              : (cfg.label as () => string)()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          {/* Pflichtpausen-Zonen (grau) */}
          {breakZones.map((z, i) => (
            <ReferenceArea
              key={`bz${i}`}
              x1={z.x1} x2={z.x2}
              fill="#e2e8f0"
              fillOpacity={0.7}
              label={{ value: 'Pause', position: 'insideTop', fontSize: 9, fill: '#64748b' }}
            />
          ))}

          {/* Extra-Stopps (amber) */}
          {extraZones.map((z, i) => (
            <ReferenceArea
              key={`ez${i}`}
              x1={z.x1} x2={z.x2}
              fill="#fef3c7"
              fillOpacity={0.9}
              label={{ value: 'Extra', position: 'insideTop', fontSize: 9, fill: '#92400e' }}
            />
          ))}

          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

          <XAxis
            dataKey="timeH"
            type="number"
            domain={[0, CHART_MAX_HOURS]}
            ticks={xTicks}
            tickFormatter={v => `${v}h`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={36}
          />

          <Tooltip content={<ChartTooltip />} />

          {/* Min-SOC Linie */}
          <ReferenceLine
            y={minSocPct}
            stroke="#ef4444"
            strokeDasharray="4 3"
            strokeWidth={1}
          />

          {/* SOC-Linie */}
          <Line
            type="linear"
            dataKey="socPct"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Badges */}
      <SegmentBadges segments={result.segments} />
    </div>
  )
}

// ─── Legende (gemeinsam für alle Charts) ─────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-6 h-0.5 bg-blue-500 rounded"></span>
        SOC-Verlauf
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-4 h-3 bg-slate-200 rounded-sm border border-slate-300"></span>
        Pflichtpause (45 min) inkl. Laden
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-4 h-3 bg-amber-100 rounded-sm border border-amber-300"></span>
        Extra-Ladestopp
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-5 border-t-2 border-dashed border-red-400"></span>
        Min. SOC
      </span>
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export function DrivingTimeline({ results, targetKm, minSocPct }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-800">
          Fahrzeitensimulation — {targetKm} km Tour (1-Fahrer, EU-VO 561/2006)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          X-Achse: Uhrzeit der Tour (0–{CHART_MAX_HOURS}h, gleicher Maßstab alle Fahrzeuge)
          · Grau = Pflichtpause inkl. Laden · Ladekurve modellbasiert
        </p>
      </div>

      <Legend />

      {/* Fahrzeug-Charts */}
      <div className="space-y-3">
        {results.map(r => (
          <VehicleChart key={r.vehicleId} result={r} minSocPct={minSocPct} />
        ))}
      </div>

      {/* Hinweis wenn Extra-Stopps vorhanden */}
      {results.some(r => r.extraChargingStops > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>Zu Extra-Ladestopps:</strong> Stopps außerhalb der Pflichtpause bedeuten
          Zeitverlust und höhere Ladungskosten (öffentliche HPC-Säulen).
          Durch optimierte Routenplanung (Laden an Rastplätzen während Pflichtpause)
          lässt sich dieser Nachteil oft vermeiden.
        </div>
      )}
    </div>
  )
}

import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import type { SimResult } from '../../types'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { formatHours } from '../../utils/format'

interface Props {
  results: SimResult[]
  driverMode: '1-Fahrer' | '2-Fahrer'
  targetKm: number
}

const STATUS_CONFIG = {
  ok: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    label: 'Ohne Extra-Ladestopp machbar',
  },
  'extra-stop': {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    label: (stops: number, minutes: number) =>
      `${stops} Extra-Ladestopp${stops > 1 ? 's'  : ''} (+${minutes} min)`,
  },
  'not-feasible': {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    label: 'Tour nicht in Tagesschicht machbar',
  },
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs">
      <div className="text-slate-500 mb-1">t = {Number(label).toFixed(1)} h</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          SOC: {Number(p.value).toFixed(1)} %
        </div>
      ))}
    </div>
  )
}

function VehicleTimeline({ result }: { result: SimResult }) {
  const cfg = STATUS_CONFIG[result.statusLabel]
  const StatusIcon = cfg.icon

  // Build chart data from socProfile
  const chartData = result.socProfile.map(p => ({
    time: Math.round(p.timeH * 10) / 10,
    soc: Math.round(p.socPct * 10) / 10,
    phase: p.phase,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-slate-800 text-sm">{result.vehicleName}</div>
          {result.feasible && (
            <div className="text-xs text-slate-500 mt-0.5">
              Gesamtzeit: {formatHours(result.totalTimeH)}
              {result.chargingStops.length > 0 && ` · ${result.chargingStops.length} Ladestopp${result.chargingStops.length > 1 ? 's' : ''}`}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${cfg.bg} ${cfg.color} flex-shrink-0`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>
            {result.statusLabel === 'extra-stop'
              ? STATUS_CONFIG['extra-stop'].label(result.extraChargingStops, result.extraChargingMinutes)
              : cfg.label as string}
          </span>
        </div>
      </div>

      {/* SOC Burndown Chart */}
      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={v => `${v}h`}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={v => `${v}%`}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Minimum SOC line */}
            <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
            {/* Charge stops markers */}
            {result.chargingStops.map((stop, i) => (
              <ReferenceLine
                key={i}
                x={Math.round(stop.timeH * 10) / 10}
                stroke={stop.isMandatoryBreak ? '#22c55e' : '#f59e0b'}
                strokeWidth={1.5}
                strokeDasharray={stop.isMandatoryBreak ? undefined : '3 3'}
              />
            ))}
            <Area
              type="monotone"
              dataKey="soc"
              fill="#dbeafe"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="SOC %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-20 flex items-center justify-center text-xs text-slate-400">
          Keine Daten
        </div>
      )}

      {/* Charging stops legend */}
      {result.chargingStops.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {result.chargingStops.map((stop, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                stop.isMandatoryBreak
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {stop.isMandatoryBreak ? '✅ Pflichtpause' : '⚠️ Extra-Stopp'} bei {Math.round(stop.kmAtStop)} km · {stop.durationMin} min
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DrivingTimeline({ results, driverMode, targetKm }: Props) {
  const anyExtraStop = results.some(r => r.extraChargingStops > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Fahrzeitensimulation — {targetKm} km Tour
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            EU-VO 561/2006 · {driverMode} · SOC-Verlauf (blau) + Ladestopps
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-green-500 inline-block rounded"></span> Laden in Pflichtpause
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-500 border-dashed inline-block rounded"></span> Extra-Ladestopp
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-400 border-dashed inline-block rounded"></span> Min. SOC 15 %
          </span>
        </div>
      </div>

      {driverMode === '2-Fahrer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <strong>2-Fahrer-Modus:</strong> Pausen werden im fahrenden Fahrzeug genommen. Laden ist nur an aktiven Stopps möglich.
          Fahrzeuge mit niedrigerer Ladeleistung (CCS2) benötigen mehr Zeit für Ladestopps als Teams mit MCS-Fahrzeugen.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {results.map(r => (
          <VehicleTimeline key={r.vehicleId} result={r} />
        ))}
      </div>

      {anyExtraStop && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>Hinweis zu Extra-Ladestopps:</strong> Ladestopps außerhalb der Pflichtpause bedeuten zusätzliche Wartezeit und damit
          höhere Fahrerlohnkosten. Durch geschickte Routenplanung (Laden bei Pflichtpausen) lässt sich dieser Nachteil oft minimieren.
        </div>
      )}
    </div>
  )
}

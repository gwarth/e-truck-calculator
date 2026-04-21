import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'
import type { TCOResults } from '../../types'
import { formatEuro } from '../../utils/format'

interface Props {
  results: TCOResults
  timeHorizon: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <div className="font-semibold text-slate-700 mb-2">Jahr {label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium">{formatEuro(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between gap-4 text-slate-500">
          <span>Differenz</span>
          <span className={`font-medium ${payload[1].value > payload[0].value ? 'text-green-600' : 'text-red-500'}`}>
            {formatEuro(Math.abs(payload[1].value - payload[0].value))}
            {payload[1].value > payload[0].value ? ' Vorteil eLKW' : ' Vorteil Diesel'}
          </span>
        </div>
      )}
    </div>
  )
}

export function CumulativeCostChart({ results }: Props) {
  const data = results.yearlyData

  const maxVal = Math.max(
    ...data.map(d => Math.max(d.electricCumulative, d.dieselCumulative))
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Kumulative Gesamtkosten im Zeitverlauf
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={v => `J${v}`}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            width={40}
            domain={[0, maxVal * 1.05]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => (
              <span className="text-slate-600">{value}</span>
            )}
          />
          {results.breakEvenYear !== null && (
            <ReferenceLine
              x={results.breakEvenYear}
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Break-even J${results.breakEvenYear}`,
                position: 'top',
                fontSize: 10,
                fill: '#16a34a',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="electricCumulative"
            name="⚡ eLKW"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="dieselCumulative"
            name="⛽ Diesel"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#f59e0b' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

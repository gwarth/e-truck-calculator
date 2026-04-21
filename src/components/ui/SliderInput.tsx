import { type ReactNode } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  tooltip?: string
  onChange: (val: number) => void
  formatDisplay?: (val: number) => string
  inputWidth?: string
  children?: ReactNode
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  tooltip,
  onChange,
  formatDisplay,
  inputWidth = 'w-24',
  children,
}: Props) {
  const display = formatDisplay ? formatDisplay(value) : String(value)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm text-slate-700 flex items-center gap-1.5">
          {label}
          {tooltip && (
            <span
              title={tooltip}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-xs cursor-help select-none leading-none"
            >
              ?
            </span>
          )}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
            }}
            className={`${inputWidth} text-sm text-right border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
          {unit && <span className="text-xs text-slate-500 whitespace-nowrap">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-blue-600 cursor-pointer"
      />
      {formatDisplay && (
        <div className="text-xs text-slate-500 text-right">{display}</div>
      )}
      {children}
    </div>
  )
}

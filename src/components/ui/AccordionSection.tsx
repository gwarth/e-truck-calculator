import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  badge?: string
}

export function AccordionSection({ title, subtitle, icon, defaultOpen = false, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        {icon && (
          <span className="text-blue-600 flex-shrink-0">{icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">{title}</span>
            {badge && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  )
}

import { Truck, Zap } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-blue-600">
          <Zap className="w-6 h-6" />
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            eLKW TCO-Rechner
          </h1>
          <p className="text-xs text-slate-500">
            Total Cost of Ownership — Elektro vs. Diesel
          </p>
        </div>
        <div className="ml-auto hidden sm:block">
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
            Alle Werte ohne Fahrerlohn
          </span>
        </div>
      </div>
    </header>
  )
}

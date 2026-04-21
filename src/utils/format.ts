const currencyFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const currencyFmt2 = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })

export function formatEuro(value: number): string {
  return currencyFmt.format(value)
}

export function formatEuro2(value: number): string {
  return currencyFmt2.format(value)
}

export function formatNumber(value: number): string {
  return numberFmt.format(value)
}

export function formatKm(value: number): string {
  return `${numberFmt.format(value)} km`
}

export function formatCentPerKm(value: number): string {
  return `${(value * 100).toFixed(1)} ct/km`
}

export function formatEuroPerKm(value: number): string {
  return `${value.toFixed(3).replace('.', ',')} €/km`
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace('.', ',')} %`
}

export function formatTons(kg: number): string {
  return `${(kg / 1000).toFixed(1).replace('.', ',')} t`
}

export function formatHours(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.round((h - hours) * 60)
  return `${hours}h ${minutes.toString().padStart(2, '0')}min`
}

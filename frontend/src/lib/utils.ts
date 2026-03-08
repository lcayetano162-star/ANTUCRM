import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatCurrency(amount: number, currency = 'DOP'): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0'
  return new Intl.NumberFormat('es-DO').format(num)
}

export function formatDateTime(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)
  const diffWeek = Math.round(diffDay / 7)
  const diffMonth = Math.round(diffDay / 30)
  const diffYear = Math.round(diffDay / 365)

  if (diffSec < 60) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHour < 24) return `hace ${diffHour} h`
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay} días`
  if (diffWeek === 1) return 'hace 1 semana'
  if (diffWeek < 4) return `hace ${diffWeek} semanas`
  if (diffMonth === 1) return 'hace 1 mes'
  if (diffMonth < 12) return `hace ${diffMonth} meses`
  if (diffYear === 1) return 'hace 1 año'
  return `hace ${diffYear} años`
}

// Alias for compatibility with date-fns format
export function formatDistanceToNow(date: string | Date): string {
  return formatRelativeTime(date)
}

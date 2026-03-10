import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function calcMoM(current: number | null, previous: number | null): number | null {
  if (!current || !previous || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-')
  return new Date(+year, +month - 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function currentMonthYear(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getStatusClasses(status: string): string {
  const map: Record<string, string> = {
    Paid: 'bg-green-50 text-green-700 border border-green-200',
    Pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    Overdue: 'bg-red-50 text-red-700 border border-red-200',
    'Not Started': 'bg-gray-50 text-gray-600 border border-gray-200',
    'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
    Done: 'bg-green-50 text-green-700 border border-green-200',
    High: 'bg-red-50 text-red-700 border border-red-200',
    Medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    Low: 'bg-green-50 text-green-700 border border-green-200',
    Starter: 'bg-gray-50 text-gray-600 border border-gray-200',
    Growth: 'bg-blue-50 text-blue-700 border border-blue-200',
    Premium: 'bg-purple-50 text-purple-700 border border-purple-200',
  }
  return map[status] ?? 'bg-gray-50 text-gray-600 border border-gray-200'
}

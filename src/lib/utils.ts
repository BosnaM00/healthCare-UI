import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function maskName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length < 2) return fullName
  const [first, ...rest] = parts
  return `${first} ${rest.map(p => p[0] + '.').join(' ')}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-3)
}

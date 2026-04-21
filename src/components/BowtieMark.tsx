import { useId } from 'react'
import { cn } from '../lib/cn'

export function BowtieMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, 'b')
  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={`${uid}g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id={`${uid}gi`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <filter id={`${uid}glow`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path fill={`url(#${uid}g)`} filter={`url(#${uid}glow)`} d="M24 4 4 24 24 44 44 24 24 4z" opacity="0.95" />
      <path fill={`url(#${uid}gi)`} d="M24 12 12 24 24 36 36 24 24 12z" />
      <circle fill="#0ea5e9" cx="24" cy="24" r="3" filter={`url(#${uid}glow)`} />
    </svg>
  )
}

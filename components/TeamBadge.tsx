'use client'

import * as Flags from 'country-flag-icons/react/3x2'
import { getTeamData } from '@/lib/teams'
import PixelPlayer from './PixelPlayer'

// Resolve a flagCode like "GB-ENG" → component key "GB_ENG"
function FlagIcon({ code, className }: { code: string; className?: string }) {
  const key = code.replace(/-/g, '_') as keyof typeof Flags
  const Flag = Flags[key]
  if (!Flag) return <span className={`inline-block bg-pitch-border rounded-sm ${className ?? ''}`} />
  return <Flag className={className ?? 'w-7 h-auto'} title={code} />
}

// ----------------------------------------------------------------
// Compact: flag + name (for score rows, tables)
// ----------------------------------------------------------------
export function TeamNameBadge({
  name,
  align = 'left',
  className = '',
  flagSize = 'w-7',
  textSize = 'text-base',
  gap = 'gap-2',
}: {
  name: string
  align?: 'left' | 'right'
  className?: string
  flagSize?: string
  textSize?: string
  gap?: string
}) {
  const { flagCode } = getTeamData(name)

  if (align === 'right') {
    return (
      <span className={`inline-flex items-center ${gap} ${className}`}>
        <span className={`text-retro-white font-semibold ${textSize} leading-tight`}>{name}</span>
        <FlagIcon code={flagCode} className={`${flagSize} h-auto rounded-sm flex-shrink-0`} />
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center ${gap} ${className}`}>
      <FlagIcon code={flagCode} className={`${flagSize} h-auto rounded-sm flex-shrink-0`} />
      <span className={`text-retro-white font-semibold ${textSize} leading-tight`}>{name}</span>
    </span>
  )
}

// ----------------------------------------------------------------
// Full: flag + name + pixel player (for standings, hero cards)
// ----------------------------------------------------------------
export function TeamCard({
  name,
  showPlayer = true,
  px = 4,
  className = '',
}: {
  name: string
  showPlayer?: boolean
  px?: number
  className?: string
}) {
  const { flagCode, jersey, shorts, socks } = getTeamData(name)

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {showPlayer && (
        <PixelPlayer jersey={jersey} shorts={shorts} socks={socks} px={px} />
      )}
      <div className="flex items-center gap-1.5">
        <FlagIcon code={flagCode} className="w-6 h-auto rounded-sm" />
        <span className="text-retro-white font-semibold text-sm leading-none text-center">{name}</span>
      </div>
    </div>
  )
}

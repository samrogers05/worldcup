'use client'

export type IconName = 'ball' | 'trophy' | 'eye' | 'table' | 'lock'

// 8×8 pixel grids. '_' = transparent, 'X' = primary color, 'D' = dark accent
const ICONS: Record<IconName, string[]> = {
  ball: [
    '_XXXXXX_',
    'XDXXXXXX',
    'XDXXXXXX',
    'XXXXXXXX',
    'XXXXXXXX',
    'XXXXXXDX',
    'XXXXXXDX',
    '_XXXXXX_',
  ],
  trophy: [
    'XXXXXXXX',
    'X_XXXX_X',
    '_X_XX_X_',
    '__XXXX__',
    '___XX___',
    '__XXXX__',
    '_XXXXXX_',
    'XXXXXXXX',
  ],
  eye: [
    '________',
    '_XXXXXX_',
    'XXXXXXXX',
    'XXDDDDXX',
    'XXDDDDXX',
    'XXXXXXXX',
    '_XXXXXX_',
    '________',
  ],
  table: [
    'XXXXXXXX',
    'X__XX__X',
    'XXXXXXXX',
    'X__XX__X',
    'XXXXXXXX',
    'X__XX__X',
    'XXXXXXXX',
    '________',
  ],
  lock: [
    '__XXXX__',
    '_X____X_',
    '_X____X_',
    'XXXXXXXX',
    'X__XX__X',
    'X__XX__X',
    'XXXXXXXX',
    'XXXXXXXX',
  ],
}

interface Props {
  icon: IconName
  color?: string
  darkColor?: string
  px?: number
}

export default function PixelIcon({
  icon,
  color = '#ffffff',
  darkColor = '#060d1e',
  px = 4,
}: Props) {
  const grid = ICONS[icon]
  const cols = grid[0].length
  const rows = grid.length
  const w = cols * px
  const h = rows * px

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      aria-hidden="true"
    >
      {grid.map((row, y) =>
        row.split('').map((cell, x) => {
          if (cell === '_') return null
          const fill = cell === 'D' ? darkColor : color
          return (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill={fill}
            />
          )
        })
      )}
    </svg>
  )
}

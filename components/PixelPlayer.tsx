// Retro 16-bit style football player sprite.
// Rendered as an SVG grid — each "pixel" is a small rect.
// Inspired by ISS Pro Evolution / PES 2000s era player select screens.

type Cell = 'H' | 'J' | 'S' | 'K' | 'B' | '_'

// 8 cols × 15 rows — each cell = `px` pixels wide/tall
const GRID: Cell[][] = [
  ['_','_','_','H','H','_','_','_'],  //  0 head top
  ['_','_','H','H','H','H','_','_'],  //  1 head
  ['_','_','H','H','H','H','_','_'],  //  2 head
  ['_','_','_','H','H','_','_','_'],  //  3 chin / neck
  ['_','J','J','J','J','J','J','_'],  //  4 collar / shoulders
  ['J','J','J','J','J','J','J','J'],  //  5 chest + arms
  ['J','J','J','J','J','J','J','J'],  //  6 torso
  ['J','J','J','J','J','J','J','J'],  //  7 lower torso
  ['_','S','S','S','S','S','S','_'],  //  8 shorts
  ['_','S','S','_','_','S','S','_'],  //  9 shorts — legs split
  ['_','K','K','_','_','K','K','_'],  // 10 socks
  ['_','K','K','_','_','K','K','_'],  // 11 socks
  ['_','K','K','_','_','K','K','_'],  // 12 socks
  ['_','K','K','_','_','K','K','_'],  // 13 socks
  ['_','B','B','_','_','B','B','_'],  // 14 boots
]

const COLS = 8
const ROWS = 15
const SKIN = '#f5d4a0'
const BOOTS = '#1a1a1a'

type Props = {
  jersey?: string
  shorts?: string
  socks?: string
  /** Pixel size in px (default 4) */
  px?: number
}

export default function PixelPlayer({
  jersey = '#2563eb',
  shorts = '#1e3a5f',
  socks  = '#f0f0f0',
  px     = 4,
}: Props) {
  const w = COLS * px
  const h = ROWS * px

  const colorOf: Record<Cell, string | null> = {
    H: SKIN,
    J: jersey,
    S: shorts,
    K: socks,
    B: BOOTS,
    _: null,
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    >
      {GRID.flatMap((row, ri) =>
        row.map((cell, ci) => {
          const fill = colorOf[cell]
          if (!fill) return null
          return (
            <rect
              key={`${ri}-${ci}`}
              x={ci * px}
              y={ri * px}
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

import { TeamNameBadge } from './TeamBadge'

type Props = {
  homeTeam: string
  awayTeam: string
  kickoffTime: string | null
  homeValue: string
  awayValue: string
  locked: boolean
  actualHome: number | null
  actualAway: number | null
  onChange: (home: string, away: string) => void
}

function formatKickoff(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function GameScoreInput({
  homeTeam,
  awayTeam,
  kickoffTime,
  homeValue,
  awayValue,
  locked,
  actualHome,
  actualAway,
  onChange,
}: Props) {
  const hasResult = actualHome !== null && actualAway !== null

  return (
    <div>
      {/* Kickoff date */}
      {kickoffTime && (
        <p className="text-base text-retro-muted mb-3 uppercase tracking-wider orbitron">
          {formatKickoff(kickoffTime)}
        </p>
      )}

      {/* Home team | inputs | away team */}
      <div className="flex items-center justify-between gap-3">

        {/* Home team — flag left, name right */}
        <div className="flex-1 flex items-center min-w-0">
          <TeamNameBadge
            name={homeTeam}
            align="left"
            flagSize="w-[22px]"
            textSize="text-[13px]"
            className="min-w-[80px]"
          />
        </div>

        {/* Score inputs — centered */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            min={0}
            max={20}
            value={homeValue}
            disabled={locked}
            onChange={e => {
              const raw = e.target.value
              if (raw === '') { onChange('', awayValue); return }
              const n = parseInt(raw, 10)
              if (!isNaN(n) && n >= 0 && n <= 20) onChange(String(n), awayValue)
            }}
            className={`score-input ${homeValue !== '' && !locked ? 'filled' : ''}`}
          />
          <span className="text-retro-muted text-lg select-none orbitron font-bold">–</span>
          <input
            type="number"
            min={0}
            max={20}
            value={awayValue}
            disabled={locked}
            onChange={e => {
              const raw = e.target.value
              if (raw === '') { onChange(homeValue, ''); return }
              const n = parseInt(raw, 10)
              if (!isNaN(n) && n >= 0 && n <= 20) onChange(homeValue, String(n))
            }}
            className={`score-input ${awayValue !== '' && !locked ? 'filled' : ''}`}
          />
        </div>

        {/* Away team — name left, flag right */}
        <div className="flex-1 flex items-center justify-end min-w-0">
          <TeamNameBadge
            name={awayTeam}
            align="right"
            flagSize="w-[22px]"
            textSize="text-[13px]"
            className="min-w-[80px]"
          />
        </div>
      </div>

      {/* Actual result */}
      {hasResult && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-[10px] text-retro-muted uppercase tracking-wider">Result</span>
          <span className="orbitron text-sm font-bold text-retro-white">
            {actualHome} – {actualAway}
          </span>
          {homeValue !== '' && awayValue !== '' && (
            <ResultBadge
              predictedHome={Number(homeValue)}
              predictedAway={Number(awayValue)}
              actualHome={actualHome}
              actualAway={actualAway}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ResultBadge({
  predictedHome, predictedAway, actualHome, actualAway,
}: {
  predictedHome: number; predictedAway: number; actualHome: number; actualAway: number
}) {
  const exact     = predictedHome === actualHome && predictedAway === actualAway
  const direction = Math.sign(predictedHome - predictedAway) === Math.sign(actualHome - actualAway)

  if (exact) return (
    <span className="orbitron text-xs font-bold px-2 py-0.5 rounded-sm"
      style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.4)' }}>
      +2
    </span>
  )
  if (direction) return (
    <span className="orbitron text-xs font-bold px-2 py-0.5 rounded-sm"
      style={{ background: 'rgba(0,255,135,0.1)', color: '#00ff87', border: '1px solid rgba(0,255,135,0.3)' }}>
      +1
    </span>
  )
  return (
    <span className="orbitron text-xs font-bold px-2 py-0.5 rounded-sm"
      style={{ background: 'rgba(255,68,85,0.1)', color: '#ff4455', border: '1px solid rgba(255,68,85,0.3)' }}>
      +0
    </span>
  )
}

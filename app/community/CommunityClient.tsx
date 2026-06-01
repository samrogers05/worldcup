'use client'

import { useEffect, useState } from 'react'
import { computePoints } from '@/lib/scoring'
import { TeamNameBadge } from '@/components/TeamBadge'
import PixelPlayer from '@/components/PixelPlayer'
import { getTeamData } from '@/lib/teams'
import type { CommunityGame, CommunityPrediction } from './page'

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const KNOCKOUT_ROUNDS = [
  { key: 'R16',  label: 'R16'   },
  { key: 'QF',   label: 'QF'    },
  { key: 'SF',   label: 'SF'    },
  { key: 'F',    label: 'Final' },
]

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function tally(predictions: CommunityPrediction[]) {
  let home = 0, draw = 0, away = 0
  for (const p of predictions) {
    const d = Math.sign(p.predictedHome - p.predictedAway)
    if (d > 0) home++
    else if (d === 0) draw++
    else away++
  }
  return { home, draw, away, total: predictions.length }
}

function stageDisplay(game: CommunityGame) {
  if (game.stage === 'group') return `Group ${game.group_name}`
  if (game.stage === 'R16')   return 'Round of 16'
  if (game.stage === 'QF')    return 'Quarter-final'
  if (game.stage === 'SF')    return 'Semi-final'
  return 'Final'
}

// ----------------------------------------------------------------
// Game predictions detail panel
// ----------------------------------------------------------------

function GamePredictions({
  game,
  currentUserId,
}: {
  game: CommunityGame
  currentUserId: string | null
}) {
  const played = game.actual_home !== null && game.actual_away !== null
  const { home, draw, away, total } = tally(game.predictions)

  return (
    <div className="space-y-3">
      {/* Game header card */}
      <div className="retro-card p-5">
        <p className="text-retro-muted text-[10px] uppercase tracking-widest mb-3 orbitron">
          {stageDisplay(game)}
          {game.kickoff_time && ` · ${formatDate(game.kickoff_time)}`}
        </p>

        {/* Teams + score with player sprites */}
        <div className="flex items-end justify-between gap-2 mt-3">
          {/* Home team */}
          <div className="flex items-end gap-2 flex-1 min-w-0">
            <PixelPlayer
              jersey={getTeamData(game.home_team).jersey}
              shorts={getTeamData(game.home_team).shorts}
              socks={getTeamData(game.home_team).socks}
              px={4}
            />
            <div className="flex-1 min-w-0">
              <TeamNameBadge name={game.home_team} align="left" />
            </div>
          </div>

          {/* Score */}
          <div className="text-center shrink-0 px-2">
            {played ? (
              <div className="orbitron text-2xl font-bold text-retro-white"
                style={{ textShadow: '0 0 20px rgba(0,255,135,0.4)' }}>
                {game.actual_home} – {game.actual_away}
              </div>
            ) : (
              <div className="orbitron text-xl text-retro-muted">VS</div>
            )}
            {played && (
              <p className="text-[9px] text-retro-muted uppercase tracking-widest mt-1">Final</p>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-end gap-2 flex-1 min-w-0 justify-end">
            <div className="flex-1 min-w-0 text-right">
              <TeamNameBadge name={game.away_team} align="right" />
            </div>
            <PixelPlayer
              jersey={getTeamData(game.away_team).jersey}
              shorts={getTeamData(game.away_team).shorts}
              socks={getTeamData(game.away_team).socks}
              px={4}
            />
          </div>
        </div>
      </div>

      {/* Distribution bar */}
      {total > 0 && (
        <div className="retro-card p-4">
          <p className="text-retro-muted text-[10px] uppercase tracking-widest mb-3 orbitron">
            {total} Prediction{total !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div>
              <div className="orbitron font-bold text-retro-white text-lg">{home}</div>
              <div className="text-[10px] text-retro-muted uppercase tracking-wide">
                {game.home_team.split(' ')[0]}
              </div>
            </div>
            <div>
              <div className="orbitron font-bold text-retro-white text-lg">{draw}</div>
              <div className="text-[10px] text-retro-muted uppercase tracking-wide">Draw</div>
            </div>
            <div>
              <div className="orbitron font-bold text-retro-white text-lg">{away}</div>
              <div className="text-[10px] text-retro-muted uppercase tracking-wide">
                {game.away_team.split(' ')[0]}
              </div>
            </div>
          </div>
          <div className="flex rounded-sm overflow-hidden h-2.5 gap-px"
            style={{ background: '#0d1f3c', border: '1px solid #1e3a5f' }}>
            {home > 0 && (
              <div className="transition-all" style={{ width: `${(home / total) * 100}%`, background: '#00ff87' }} />
            )}
            {draw > 0 && (
              <div className="transition-all" style={{ width: `${(draw / total) * 100}%`, background: '#4a6a8a' }} />
            )}
            {away > 0 && (
              <div className="transition-all" style={{ width: `${(away / total) * 100}%`, background: '#ff9500' }} />
            )}
          </div>
        </div>
      )}

      {/* Per-user predictions table */}
      <div className="retro-card overflow-hidden">
        {game.predictions.length === 0 ? (
          <p className="text-center text-retro-muted text-xs py-8 uppercase tracking-wide">
            No predictions for this game.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pitch-border">
                <th className="py-2.5 px-4 text-[10px] text-retro-muted font-bold uppercase tracking-wider text-left">
                  Player
                </th>
                <th className="py-2.5 px-3 text-[10px] text-retro-muted font-bold uppercase tracking-wider text-center">
                  Pick
                </th>
                {played && (
                  <th className="py-2.5 px-4 text-[10px] text-retro-muted font-bold uppercase tracking-wider text-right">
                    Pts
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {game.predictions.map(pred => {
                const isYou = pred.userId === currentUserId
                const pts   = played ? computePoints(pred.predictedHome, pred.predictedAway, game.actual_home!, game.actual_away!) : null

                return (
                  <tr
                    key={pred.userId}
                    className="border-b border-pitch-border transition-colors"
                    style={{
                      background: pts === 2
                        ? 'rgba(255,215,0,0.06)'
                        : pts === 1
                          ? 'rgba(0,255,135,0.04)'
                          : pts === 0
                            ? 'rgba(255,68,85,0.04)'
                            : 'transparent',
                      borderLeft: pts === 2
                        ? '2px solid rgba(255,215,0,0.5)'
                        : pts === 1
                          ? '2px solid rgba(0,255,135,0.4)'
                          : pts === 0
                            ? '2px solid rgba(255,68,85,0.3)'
                            : '2px solid transparent',
                    }}
                  >
                    <td className="py-2.5 px-4 text-retro-white font-semibold uppercase tracking-wide text-xs">
                      {pred.userName}
                      {isYou && (
                        <span className="ml-2 text-[9px] text-neon uppercase tracking-widest">YOU</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center orbitron font-bold text-neon text-sm">
                      {pred.predictedHome}–{pred.predictedAway}
                    </td>
                    {played && (
                      <td className="py-2.5 px-4 text-right">
                        {pts === 2 ? (
                          <span className="orbitron text-xs font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.4)' }}>
                            +2
                          </span>
                        ) : pts === 1 ? (
                          <span className="orbitron text-xs font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ background: 'rgba(0,255,135,0.1)', color: '#00ff87', border: '1px solid rgba(0,255,135,0.3)' }}>
                            +1
                          </span>
                        ) : (
                          <span className="orbitron text-xs font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ background: 'rgba(255,68,85,0.1)', color: '#ff4455', border: '1px solid rgba(255,68,85,0.3)' }}>
                            +0
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Game list item
// ----------------------------------------------------------------

function GameListItem({
  game, selected, onClick,
}: {
  game: CommunityGame
  selected: boolean
  onClick: () => void
}) {
  const played    = game.actual_home !== null && game.actual_away !== null
  const predCount = game.predictions.length

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-sm transition-colors"
      style={{
        background: selected ? 'rgba(0,255,135,0.08)' : '#0d1f3c',
        border: `1px solid ${selected ? '#00ff87' : '#1e3a5f'}`,
        boxShadow: selected ? '0 0 10px rgba(0,255,135,0.1)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold truncate uppercase tracking-wide"
          style={{ color: selected ? '#00ff87' : '#e8f4fd' }}>
          {game.home_team} vs {game.away_team}
        </span>
        {played ? (
          <span className="orbitron text-xs font-bold text-retro-white shrink-0">
            {game.actual_home}–{game.actual_away}
          </span>
        ) : (
          <span className="orbitron text-[10px] text-retro-muted shrink-0">
            {formatDate(game.kickoff_time)}
          </span>
        )}
      </div>
      <div className="text-[10px] text-retro-muted mt-0.5 uppercase tracking-wide">
        {predCount} prediction{predCount !== 1 ? 's' : ''}
      </div>
    </button>
  )
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

type StagePick = 'group' | 'knockout'

export default function CommunityClient({ games }: { games: CommunityGame[] }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [stagePick, setStagePick]         = useState<StagePick>('group')
  const [activeGroup, setActiveGroup]     = useState('A')
  const [activeRound, setActiveRound]     = useState<'R16' | 'QF' | 'SF' | 'F'>('R16')
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [showDetail, setShowDetail]       = useState(false)

  useEffect(() => { setCurrentUserId(localStorage.getItem('wc_user_id')) }, [])

  const visibleGames = games.filter(g => {
    if (stagePick === 'group') return g.stage === 'group' && g.group_name === activeGroup
    return g.stage === activeRound
  })

  useEffect(() => {
    if (visibleGames.length > 0) {
      setSelectedGameId(visibleGames[0].id)
      setShowDetail(false)
    } else {
      setSelectedGameId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagePick, activeGroup, activeRound])

  const selectedGame    = games.find(g => g.id === selectedGameId) ?? null
  const knockoutGames   = games.filter(g => g.stage !== 'group')

  return (
    <div className="page-root">
      <header className="retro-header px-4 py-5">
        <div className="page-container">
          <a href="/" className="text-retro-muted text-[10px] uppercase tracking-widest hover:text-neon transition-colors mb-2 inline-block">
            ← Home
          </a>
          <h1 className="pixel-title-sm text-retro-white">Community Predictions</h1>
        </div>
      </header>

      <div className="page-container py-6">
        {/* Stage toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'group' as StagePick, label: 'Group Stage' },
            { key: 'knockout' as StagePick, label: 'Knockout' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => { setStagePick(s.key); setShowDetail(false) }}
              className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors ${
                stagePick === s.key
                  ? 'bg-neon text-pitch-dark'
                  : 'text-retro-muted border border-pitch-border hover:border-pitch-mid'
              }`}
            >
              {s.label}
              {s.key === 'knockout' && knockoutGames.length === 0 && (
                <span className="ml-1.5 opacity-50">(none yet)</span>
              )}
            </button>
          ))}
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
          {stagePick === 'group'
            ? GROUPS.map(g => {
                const hasResults = games.some(gm => gm.stage === 'group' && gm.group_name === g && gm.actual_home !== null)
                return (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className={`retro-tab relative shrink-0 w-10 h-10 font-bold text-sm ${activeGroup === g ? 'active' : ''}`}
                  >
                    {g}
                    {hasResults && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                        style={{ background: '#00ff87', boxShadow: '0 0 6px #00ff87' }} />
                    )}
                  </button>
                )
              })
            : KNOCKOUT_ROUNDS.map(r => {
                const count = games.filter(g => g.stage === r.key).length
                return (
                  <button
                    key={r.key}
                    onClick={() => setActiveRound(r.key as typeof activeRound)}
                    className={`retro-tab shrink-0 px-4 h-10 font-bold text-sm ${activeRound === r.key ? 'active' : ''}`}
                  >
                    {r.label}
                    {count > 0 && <span className="ml-1 text-[10px] opacity-75">({count})</span>}
                  </button>
                )
              })
          }
        </div>

        {/* 2-panel layout */}
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-4">
          {/* Game list */}
          <div className={`space-y-1.5 ${showDetail ? 'hidden lg:block' : 'block'}`}>
            {visibleGames.length === 0 ? (
              <div className="retro-card p-6 text-center text-retro-muted text-xs uppercase tracking-wide">
                No games available yet.
              </div>
            ) : (
              visibleGames.map(game => (
                <GameListItem
                  key={game.id}
                  game={game}
                  selected={game.id === selectedGameId}
                  onClick={() => { setSelectedGameId(game.id); setShowDetail(true) }}
                />
              ))
            )}
          </div>

          {/* Detail panel */}
          <div className={showDetail ? 'block' : 'hidden lg:block'}>
            <button
              onClick={() => setShowDetail(false)}
              className="lg:hidden flex items-center gap-1 text-neon text-[10px] uppercase tracking-widest mb-3 hover:text-neon-dim transition-colors"
            >
              ← Back to games
            </button>

            {selectedGame ? (
              <GamePredictions game={selectedGame} currentUserId={currentUserId} />
            ) : (
              <div className="retro-card p-10 text-center text-retro-muted text-xs uppercase tracking-wide hidden lg:block">
                Select a game to see predictions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

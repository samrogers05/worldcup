'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import GameScoreInput from '@/components/GameScoreInput'
import { saveKnockoutPredictions } from '@/lib/actions'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { KnockoutGame, RoundSettings } from './page'

type PredMap = Record<string, { home: string; away: string }>

const ROUNDS: { key: 'R32' | 'R16' | 'QF' | 'SF' | 'F'; label: string }[] = [
  { key: 'R32', label: 'Round of 32' },
  { key: 'R16', label: 'Round of 16' },
  { key: 'QF',  label: 'Quarter-finals' },
  { key: 'SF',  label: 'Semi-finals' },
  { key: 'F',   label: 'Final' },
]

export default function KnockoutPredictClient({
  games,
  roundSettings,
}: {
  games: KnockoutGame[]
  roundSettings: RoundSettings
}) {
  const router = useRouter()
  const [userId, setUserId]               = useState<string | null>(null)
  const [mounted, setMounted]             = useState(false)
  const [activeRound, setActiveRound]     = useState<'R32' | 'R16' | 'QF' | 'SF' | 'F'>('R32')
  const [predictions, setPredictions]     = useState<PredMap>({})
  const [loadingPreds, setLoadingPreds]   = useState(false)
  const [savingRound, setSavingRound]     = useState<string | null>(null)
  const [saveStatus, setSaveStatus]       = useState<Record<string, string>>({})

  useEffect(() => {
    setMounted(true)
    const id = localStorage.getItem('wc_user_id')
    if (!id) { router.replace('/'); return }
    setUserId(id)
  }, [router])

  useEffect(() => {
    if (!userId) return
    setLoadingPreds(true)
    getSupabaseBrowserClient()
      .from('predictions')
      .select('game_id, predicted_home, predicted_away')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          const map: PredMap = {}
          for (const p of data) {
            map[p.game_id] = { home: String(p.predicted_home), away: String(p.predicted_away) }
          }
          setPredictions(map)
        }
        setLoadingPreds(false)
      })
  }, [userId])

  useEffect(() => {
    if (!mounted || loadingPreds) return
    const firstOpen = ROUNDS.find(r => roundSettings[r.key])
    if (firstOpen) { setActiveRound(firstOpen.key); return }
    const firstWithPreds = ROUNDS.find(r =>
      games.filter(g => g.stage === r.key).some(g => predictions[g.id])
    )
    if (firstWithPreds) setActiveRound(firstWithPreds.key)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, loadingPreds])

  const handleChange = useCallback((gameId: string, home: string, away: string) => {
    setPredictions(prev => ({ ...prev, [gameId]: { home, away } }))
  }, [])

  async function handleSave(round: 'R32' | 'R16' | 'QF' | 'SF' | 'F') {
    if (!userId) return
    const roundGames = games.filter(g => g.stage === round)
    const toSave = roundGames
      .filter(g => predictions[g.id]?.home !== '' && predictions[g.id]?.away !== '')
      .map(g => ({
        gameId: g.id,
        predictedHome: parseInt(predictions[g.id].home, 10),
        predictedAway: parseInt(predictions[g.id].away, 10),
      }))
      .filter(p => !isNaN(p.predictedHome) && !isNaN(p.predictedAway))

    if (toSave.length === 0) {
      setSaveStatus(prev => ({ ...prev, [round]: 'Fill in at least one score first.' }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [round]: '' })), 3000)
      return
    }

    setSavingRound(round)
    const result = await saveKnockoutPredictions(userId, round, toSave)
    setSavingRound(null)

    if ('error' in result) {
      setSaveStatus(prev => ({ ...prev, [round]: result.error }))
    } else {
      setSaveStatus(prev => ({ ...prev, [round]: `SAVED ${toSave.length}` }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [round]: '' })), 3000)
    }
  }

  if (!mounted) return null

  const activeGames  = games.filter(g => g.stage === activeRound)
  const isOpen       = roundSettings[activeRound]
  const userHasPreds = activeGames.some(g => predictions[g.id])
  const filledCount  = activeGames.filter(g => {
    const p = predictions[g.id]
    return p && p.home !== '' && p.away !== ''
  }).length

  return (
    <div className="page-root">
      <header className="retro-header px-4 py-5">
        <div className="page-container">
          <div className="flex items-center gap-2 mb-2">
            <a href="/" className="text-retro-muted text-[10px] uppercase tracking-widest hover:text-neon transition-colors">
              ← Home
            </a>
            <span className="text-pitch-border text-[10px]">/</span>
            <a href="/predict" className="text-retro-muted text-[10px] uppercase tracking-widest hover:text-neon transition-colors">
              Group Stage
            </a>
          </div>
          <h1 className="pixel-title-sm text-retro-white">Knockout Predictions</h1>
        </div>
      </header>

      <div className="page-container py-6">
        {/* Round tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
          {ROUNDS.map(r => {
            const open       = roundSettings[r.key]
            const roundGames = games.filter(g => g.stage === r.key)
            const hasPreds   = roundGames.some(g => predictions[g.id])
            const accessible = open || hasPreds
            const isActive   = activeRound === r.key

            return (
              <button
                key={r.key}
                onClick={() => setActiveRound(r.key)}
                className="shrink-0 px-4 h-10 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all relative"
                style={{
                  background: isActive ? '#00ff87' : '#0d1f3c',
                  color: isActive ? '#060d1e' : accessible ? '#e8f4fd' : '#2a4a6a',
                  border: `1px solid ${isActive ? '#00ff87' : accessible ? '#1e3a5f' : '#112444'}`,
                  boxShadow: isActive ? '0 0 12px rgba(0,255,135,0.4)' : 'none',
                }}
              >
                {r.label}
                {open && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: '#00ff87', boxShadow: '0 0 6px #00ff87' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Round card */}
        <div className="retro-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="pixel-title-xs text-retro-white">
                {ROUNDS.find(r => r.key === activeRound)?.label}
              </h2>
              <p className="orbitron text-[10px] uppercase tracking-wider mt-1">
                {isOpen ? (
                  <span className="text-neon">Predictions Open</span>
                ) : (
                  <span className="text-retro-muted">Predictions Closed</span>
                )}
              </p>
            </div>
            {activeGames.length > 0 && (
              <span className="orbitron text-[10px] text-retro-muted uppercase">
                {loadingPreds ? 'Loading...' : `${filledCount} / ${activeGames.length}`}
              </span>
            )}
          </div>

          {activeGames.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-retro-muted text-xs uppercase tracking-wide">
                Games appear once teams are confirmed.
              </p>
            </div>
          ) : !isOpen && !userHasPreds ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3 select-none">🔒</div>
              <p className="pixel-title-xs text-retro-muted mb-2">Locked</p>
              <p className="text-retro-muted text-[10px] uppercase tracking-wide">
                Check back when the admin opens this round.
              </p>
            </div>
          ) : (
            <>
              {activeGames.map((game, i) => (
                <div
                  key={game.id}
                  className="px-3 py-3 rounded-sm"
                  style={{ background: i % 2 === 1 ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                >
                  <GameScoreInput
                    homeTeam={game.home_team}
                    awayTeam={game.away_team}
                    kickoffTime={game.kickoff_time}
                    homeValue={predictions[game.id]?.home ?? ''}
                    awayValue={predictions[game.id]?.away ?? ''}
                    locked={!isOpen}
                    actualHome={game.actual_home}
                    actualAway={game.actual_away}
                    onChange={(home, away) => handleChange(game.id, home, away)}
                  />
                </div>
              ))}

              {isOpen && (
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => handleSave(activeRound)}
                    disabled={savingRound === activeRound || filledCount === 0}
                    className="retro-btn flex-1"
                  >
                    {savingRound === activeRound
                      ? 'SAVING...'
                      : `SAVE ${ROUNDS.find(r => r.key === activeRound)?.label.toUpperCase()}`}
                  </button>
                  {saveStatus[activeRound] && (
                    <span className={`orbitron text-xs font-bold ${
                      saveStatus[activeRound].startsWith('SAVED') ? 'text-neon' : 'text-retro-red'
                    }`}>
                      {saveStatus[activeRound]}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Round overview grid */}
        <div className="retro-card p-4 mt-4">
          <h3 className="pixel-title-xs text-retro-muted uppercase tracking-widest mb-4">Round Overview</h3>
          <div className="grid grid-cols-2 gap-2">
            {ROUNDS.map(r => {
              const open       = roundSettings[r.key]
              const roundGames = games.filter(g => g.stage === r.key)
              const filled     = roundGames.filter(g => {
                const p = predictions[g.id]
                return p && p.home !== '' && p.away !== ''
              }).length
              const hasPreds = roundGames.some(g => predictions[g.id])
              const isActive = activeRound === r.key

              return (
                <button
                  key={r.key}
                  onClick={() => setActiveRound(r.key)}
                  className="rounded-sm p-3 text-left transition-all"
                  style={{
                    background: open ? 'rgba(0,255,135,0.06)' : '#0d1f3c',
                    border: `1px solid ${isActive ? '#00ff87' : open ? 'rgba(0,255,135,0.3)' : '#1e3a5f'}`,
                    boxShadow: isActive ? '0 0 10px rgba(0,255,135,0.15)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-retro-white uppercase tracking-wider">
                      {r.label}
                    </span>
                    {open
                      ? <span className="text-[9px] text-neon uppercase tracking-widest orbitron">Open</span>
                      : <span className="text-[9px] text-retro-muted uppercase tracking-widest orbitron">Closed</span>
                    }
                  </div>
                  <div className="orbitron text-[10px] text-retro-muted mt-1">
                    {roundGames.length === 0
                      ? 'No games yet'
                      : `${filled}/${roundGames.length} predictions`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

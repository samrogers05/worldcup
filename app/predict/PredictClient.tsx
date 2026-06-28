'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import GameScoreInput from '@/components/GameScoreInput'
import { savePredictions } from '@/lib/actions'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type Game = {
  id: string
  group_name: string
  home_team: string
  away_team: string
  kickoff_time: string | null
  actual_home: number | null
  actual_away: number | null
  match_number: number | null
}

type Props = {
  games: Game[]
  lockTime: string | null
}

type PredMap = Record<string, { home: string; away: string }>

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

function useCountdown(lockTime: string | null) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!lockTime) return
    const target = new Date(lockTime).getTime()
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) { setLabel(null); return }
      const d = Math.floor(diff / 86_400_000)
      const h = Math.floor((diff % 86_400_000) / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setLabel(d > 0 ? `${d}D ${h}H ${m}M ${s}S` : `${h}H ${m}M ${s}S`)
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [lockTime])

  return label
}

export default function PredictClient({ games, lockTime }: Props) {
  const router = useRouter()
  const [userId, setUserId]           = useState<string | null>(null)
  const [mounted, setMounted]         = useState(false)
  const [activeGroup, setActiveGroup] = useState('A')
  const [predictions, setPredictions] = useState<PredMap>({})
  const [loadingPreds, setLoadingPreds] = useState(false)
  const [savingGroup, setSavingGroup] = useState<string | null>(null)
  const [saveStatus, setSaveStatus]   = useState<Record<string, string>>({})

  const countdown = useCountdown(lockTime)
  const isLocked  = lockTime ? new Date() >= new Date(lockTime) : false

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
            map[p.game_id] = { home: p.predicted_home.toString(), away: p.predicted_away.toString() }
          }
          setPredictions(map)
        }
        setLoadingPreds(false)
      })
  }, [userId])

  const groupedGames = GROUPS.reduce<Record<string, Game[]>>((acc, g) => {
    acc[g] = games.filter(gm => gm.group_name === g)
    return acc
  }, {})

  const handleChange = useCallback((gameId: string, home: string, away: string) => {
    setPredictions(prev => ({ ...prev, [gameId]: { home, away } }))
  }, [])

  async function handleSave(group: string) {
    if (!userId) return
    const toSave = (groupedGames[group] ?? [])
      .filter(g => { const p = predictions[g.id]; return p && p.home !== '' && p.away !== '' })
      .map(g => ({
        gameId: g.id,
        predictedHome: parseInt(predictions[g.id].home, 10),
        predictedAway: parseInt(predictions[g.id].away, 10),
      }))
      .filter(p => !isNaN(p.predictedHome) && !isNaN(p.predictedAway))

    if (toSave.length === 0) {
      setSaveStatus(prev => ({ ...prev, [group]: 'Fill in at least one score first.' }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [group]: '' })), 3000)
      return
    }

    setSavingGroup(group)
    const result = await savePredictions(userId, toSave)
    setSavingGroup(null)

    if ('error' in result) {
      setSaveStatus(prev => ({ ...prev, [group]: result.error }))
    } else {
      setSaveStatus(prev => ({ ...prev, [group]: `SAVED ${toSave.length}` }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [group]: '' })), 3000)
    }
  }

  if (!mounted) return null

  const activeGames  = groupedGames[activeGroup] ?? []
  const filledCount  = activeGames.filter(g => { const p = predictions[g.id]; return p && p.home !== '' && p.away !== '' }).length

  return (
    <div className="page-root">

      {/* Header */}
      <header className="retro-header px-6 py-8">
        <div className="page-container">
          <div className="flex items-center gap-3 mb-3">
            <a href="/" className="text-retro-muted text-base uppercase tracking-widest hover:text-neon transition-colors">
              ← Home
            </a>
            <span className="text-pitch-border text-base">/</span>
            <a href="/predict/knockout" className="text-retro-muted text-base uppercase tracking-widest hover:text-neon transition-colors">
              Knockout Predictions →
            </a>
          </div>
          <h1 className="pixel-title text-retro-white">Group Stage Predictions</h1>
        </div>
      </header>

      {/* Status bar */}
      <div className={`status-bar ${
        isLocked
          ? 'text-retro-red'
          : countdown
            ? 'text-retro-amber'
            : 'text-neon'
      }`}>
        {isLocked
          ? '[ LOCKED — PREDICTIONS CLOSED ]'
          : countdown
            ? `[ LOCK IN: ${countdown} ]`
            : '[ PREDICTIONS OPEN ]'}
      </div>

      <div className="page-container py-6 space-y-6">

        {/* Group tabs — flex, each tab fills equal width */}
        <div className="flex gap-1 sm:gap-2">
          {GROUPS.map(g => {
            const gGames = groupedGames[g] ?? []
            const filled = gGames.filter(gm => { const p = predictions[gm.id]; return p && p.home !== '' && p.away !== '' }).length
            const complete = filled === gGames.length && gGames.length > 0
            const partial  = filled > 0 && !complete
            return (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`retro-tab relative flex-1 h-9 sm:h-14 font-bold text-sm sm:text-base ${activeGroup === g ? 'active' : ''}`}
              >
                {g}
                {complete && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: '#00ff87', boxShadow: '0 0 6px #00ff87' }} />
                )}
                {partial && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: '#ff9500', boxShadow: '0 0 6px #ff9500' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Group card */}
        <div className="retro-card p-3 sm:p-8">

          {/* Card header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="pixel-title-sm text-retro-white">Group {activeGroup}</h2>
            <span className="orbitron text-base text-retro-muted uppercase">
              {loadingPreds ? 'Loading...' : `${filledCount} / ${activeGames.length} filled`}
            </span>
          </div>

          {/* Games — 2-col grid on large screens */}
          {activeGames.length === 0 ? (
            <p className="text-retro-muted text-xs text-center py-8 uppercase tracking-wide">No games found.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {activeGames.map(game => (
                <div
                  key={game.id}
                  className="rounded-sm p-3"
                  style={{ background: 'rgba(6,13,30,0.7)', border: '1px solid #1e3a5f' }}
                >
                  <GameScoreInput
                    homeTeam={game.home_team}
                    awayTeam={game.away_team}
                    kickoffTime={game.kickoff_time}
                    homeValue={predictions[game.id]?.home ?? ''}
                    awayValue={predictions[game.id]?.away ?? ''}
                    locked={isLocked}
                    actualHome={game.actual_home}
                    actualAway={game.actual_away}
                    onChange={(home, away) => handleChange(game.id, home, away)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Save button — full width */}
          {!isLocked && (
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => handleSave(activeGroup)}
                disabled={savingGroup === activeGroup || filledCount === 0}
                className="retro-btn flex-1"
                style={{ fontSize: '13px', padding: '8px 14px' }}
              >
                {savingGroup === activeGroup ? 'SAVING...' : `SAVE GROUP ${activeGroup}`}
              </button>
              {saveStatus[activeGroup] && (
                <span className={`orbitron text-lg font-bold shrink-0 ${
                  saveStatus[activeGroup].startsWith('SAVED') ? 'text-neon' : 'text-retro-red'
                }`}>
                  {saveStatus[activeGroup]}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress summary — full width */}
        <div className="retro-card p-8">
          <h3 className="pixel-title text-retro-muted uppercase tracking-widest mb-6">Overall Progress</h3>
          <div className="flex gap-2">
            {GROUPS.map(g => {
              const gGames  = groupedGames[g] ?? []
              const filled  = gGames.filter(gm => { const p = predictions[gm.id]; return p && p.home !== '' && p.away !== '' }).length
              const complete = filled === gGames.length && gGames.length > 0
              const partial  = filled > 0 && !complete
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`flex-1 rounded-sm py-5 text-xl font-bold text-center transition-all ${
                    activeGroup === g ? 'ring-1 ring-neon' : ''
                  }`}
                  style={{
                    background: complete ? 'rgba(0,255,135,0.1)' : partial ? 'rgba(255,149,0,0.1)' : '#0d1f3c',
                    color: complete ? '#00ff87' : partial ? '#ff9500' : '#4a6a8a',
                    border: `1px solid ${complete ? 'rgba(0,255,135,0.3)' : partial ? 'rgba(255,149,0,0.3)' : '#1e3a5f'}`,
                  }}
                >
                  {g}
                  <div className="text-[12px] font-normal opacity-75 mt-1 orbitron">
                    {filled}/{gGames.length}
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

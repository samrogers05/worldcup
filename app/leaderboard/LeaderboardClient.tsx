'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { getUserDrillDown } from '@/lib/queries'
import type { LeaderboardEntry, DrillDownRow } from '@/lib/queries'

type Filter = 'all' | 'group'

function sortedLeaderboard(entries: LeaderboardEntry[], filter: Filter): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (filter === 'group') return b.groupPoints - a.groupPoints || a.name.localeCompare(b.name)
    return b.points - a.points || a.name.localeCompare(b.name)
  })
}

// ----------------------------------------------------------------
// Drill-down modal
// ----------------------------------------------------------------

function DrillDownModal({
  entry, currentUserId, onClose,
}: {
  entry: LeaderboardEntry
  currentUserId: string | null
  onClose: () => void
}) {
  const [rows, setRows] = useState<DrillDownRow[] | null>(null)

  useEffect(() => {
    getUserDrillDown(entry.id, getSupabaseBrowserClient()).then(setRows)
  }, [entry.id])

  const filtered = rows?.filter(r => r.stage === 'group')

  const totalPts = filtered?.reduce((sum, r) => sum + (r.points ?? 0), 0) ?? 0
  const maxLeft  = filtered?.reduce((sum, r) => sum + (r.points === null ? 3 : 0), 0) ?? 0

  function stageLabel(row: DrillDownRow) {
    if (row.stage === 'group') return `Group ${row.groupName}`
    if (row.stage === 'R32')   return 'R32'
    if (row.stage === 'R16')   return 'R16'
    if (row.stage === 'QF')    return 'QF'
    if (row.stage === 'SF')    return 'SF'
    return 'Final'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(6,13,30,0.9)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="retro-card w-full sm:max-w-2xl sm:rounded-md rounded-t-md flex flex-col max-h-[90vh]"
        style={{ boxShadow: '0 0 40px rgba(0,255,135,0.15)' }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pitch-border shrink-0">
          <div>
            <h2 className="orbitron text-retro-white font-bold text-lg tracking-wide uppercase">
              {entry.name}
              {entry.id === currentUserId && (
                <span className="ml-2 text-[10px] font-normal text-neon normal-case tracking-normal">(you)</span>
              )}
            </h2>
            <p className="text-retro-muted text-[10px] uppercase tracking-wider mt-0.5 orbitron">
              {entry.points} pts &middot; +{entry.maxPossible} possible
            </p>
          </div>
          <button onClick={onClose}
            className="text-retro-muted hover:text-retro-red text-2xl leading-none font-light transition-colors">
            ×
          </button>
        </div>

        {/* Points summary */}
        {filtered && (
          <div className="px-5 pt-3 pb-2 shrink-0">
            <span className="orbitron text-[10px] text-retro-muted">
              {totalPts} pts{maxLeft > 0 ? ` · +${maxLeft} left` : ''}
            </span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {!filtered ? (
            <div className="py-10 text-center text-retro-muted text-xs uppercase tracking-wide">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-retro-muted text-xs uppercase tracking-wide">No predictions for this stage.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ background: '#0d1f3c' }}>
                <tr className="text-left border-b border-pitch-border">
                  <th className="py-2.5 pr-2 text-[10px] text-retro-muted font-bold uppercase tracking-wider">Game</th>
                  <th className="py-2.5 text-[10px] text-retro-muted font-bold uppercase tracking-wider text-center">Prediction</th>
                  <th className="py-2.5 text-[10px] text-retro-muted font-bold uppercase tracking-wider text-center">Result</th>
                  <th className="py-2.5 text-[10px] text-retro-muted font-bold uppercase tracking-wider text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const played = row.actualHome !== null && row.actualAway !== null
                  const pts    = row.points
                  return (
                    <tr key={row.gameId} className="border-b border-pitch-border hover:bg-pitch-mid transition-colors">
                      <td className="py-2.5 pr-2">
                        <span className="text-[10px] text-retro-muted block uppercase orbitron">
                          {stageLabel(row)}
                        </span>
                        <span className="text-retro-white font-semibold text-xs">
                          {row.homeTeam} vs {row.awayTeam}
                        </span>
                      </td>
                      <td className="py-2.5 text-center orbitron text-sm font-bold text-neon">
                        {row.predictedHome}–{row.predictedAway}
                      </td>
                      <td className="py-2.5 text-center orbitron text-sm font-bold">
                        {played
                          ? <span className="text-retro-white">{row.actualHome}–{row.actualAway}</span>
                          : <span className="text-pitch-border">—</span>
                        }
                      </td>
                      <td className="py-2.5 text-right">
                        {!played ? (
                          <span className="text-pitch-border orbitron text-xs">—</span>
                        ) : pts === 3 ? (
                          <span className="orbitron text-xs font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.4)' }}>
                            +3
                          </span>
                        ) : pts === 2 ? (
                          <span className="orbitron text-xs font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ background: 'rgba(184,196,208,0.15)', color: '#b8c4d0', border: '1px solid rgba(184,196,208,0.4)' }}>
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

export default function LeaderboardClient({ leaderboard, lockTime }: { leaderboard: LeaderboardEntry[], lockTime: string | null }) {
  const [filter, setFilter]             = useState<Filter>('all')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selected, setSelected]         = useState<LeaderboardEntry | null>(null)

  const isLocked = lockTime ? new Date() >= new Date(lockTime) : false

  useEffect(() => { setCurrentUserId(localStorage.getItem('wc_user_id')) }, [])

  const sorted           = sortedLeaderboard(leaderboard, filter)
  const currentUserIndex = currentUserId ? sorted.findIndex(e => e.id === currentUserId) : -1

  return (
    <>
      {selected && (
        <DrillDownModal
          entry={selected}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="page-root">
        <header className="retro-header px-4 py-5">
          <div className="page-container">
            <a href="/" className="text-retro-muted text-[20px] uppercase tracking-widest hover:text-neon transition-colors mb-2 inline-block">
              ← Home
            </a>
            <h1 className="pixel-title-sm text-retro-white" style={{ fontSize: '20px' }}>Leaderboard</h1>
          </div>
        </header>

        <div className="page-container py-6 space-y-5">
          {/* Your position banner */}
          {currentUserIndex > 2 && (
            <div className="retro-card px-4 py-3 flex items-center gap-3"
              style={{ borderColor: 'rgba(0,255,135,0.3)' }}>
              <span className="text-neon text-[20px] uppercase tracking-widest orbitron">
                YOU ARE #{currentUserIndex + 1} &middot; {sorted[currentUserIndex].points} PTS
              </span>
            </div>
          )}

          <div className="retro-card overflow-hidden">
            {/* Filter tabs */}
            <div className="flex border-b border-pitch-border">
              {(['all', 'group'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-3 text-[20px] font-bold uppercase tracking-wider transition-colors ${
                    filter === f
                      ? 'text-neon border-b-2 border-neon'
                      : 'text-retro-muted hover:text-retro-white'
                  }`}
                >
                  {f === 'all' ? 'All' : 'Group'}
                </button>
              ))}
            </div>

            {/* Table */}
            {sorted.length === 0 ? (
              <p className="text-center text-retro-muted text-xs py-12 uppercase tracking-wide">
                No predictions submitted yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pitch-border">
                    <th className="py-2.5 px-2 sm:px-4 text-[11px] sm:text-[20px] text-retro-muted font-bold uppercase tracking-wider text-left w-8 sm:w-10">#</th>
                    <th className="py-2.5 text-[11px] sm:text-[20px] text-retro-muted font-bold uppercase tracking-wider text-left">Name</th>
                    <th className="py-2.5 px-1 sm:px-2 text-[11px] sm:text-[20px] text-retro-muted font-bold uppercase tracking-wider text-right hidden sm:table-cell">Grp</th>
                    <th className="py-2.5 px-1 sm:px-2 text-[11px] sm:text-[20px] text-retro-muted font-bold uppercase tracking-wider text-right hidden sm:table-cell">KO</th>
                    <th className="py-2.5 px-2 text-[11px] sm:text-[20px] text-retro-muted font-bold uppercase tracking-wider text-right">Pts</th>
                    <th className="py-2.5 px-2 sm:px-4 text-[11px] sm:text-[20px] text-retro-muted font-bold uppercase tracking-wider text-right hidden sm:table-cell">+Max</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, i) => {
                    const isYou = entry.id === currentUserId
                    const pts   = filter === 'group' ? entry.groupPoints : entry.points
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => { if (isLocked || entry.id === currentUserId) setSelected(entry) }}
                        className={`border-b border-pitch-border transition-colors hover:bg-pitch-mid ${isLocked || entry.id === currentUserId ? 'cursor-pointer' : 'cursor-default'}`}
                        style={isYou ? { background: 'rgba(0,255,135,0.04)', borderLeft: '2px solid #00ff87' } : {}}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <RankCell i={i} />
                        </td>
                        <td className="py-2 sm:py-3">
                          <span className={`font-semibold text-[14px] sm:text-[32px] uppercase tracking-wide ${isYou ? 'text-neon' : 'text-retro-white'}`}>
                            {entry.name}
                          </span>
                          {isYou && (
                            <span className="ml-1 sm:ml-2 text-[10px] sm:text-[18px] text-neon uppercase tracking-widest">YOU</span>
                          )}
                        </td>
                        <td className="py-2 sm:py-3 px-1 sm:px-2 text-right orbitron hidden sm:table-cell">
                          <span className={`text-[24px] ${filter === 'group' ? 'text-retro-white font-bold' : 'text-retro-muted'}`}>
                            {entry.groupPoints}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-1 sm:px-2 text-right orbitron hidden sm:table-cell">
                          <span className="text-[24px] text-retro-muted">
                            {entry.knockoutPoints}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-right orbitron">
                          <span className={`text-[16px] sm:text-[28px] font-bold ${isYou ? 'text-neon' : 'text-retro-white'}`}>
                            {pts}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-right orbitron text-retro-muted text-[24px] hidden sm:table-cell">
                          +{entry.maxPossible}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-center text-retro-muted text-[20px] uppercase tracking-wider">
            Tap any row to see prediction breakdown
          </p>
        </div>
      </div>
    </>
  )
}

function RankCell({ i }: { i: number }) {
  if (i === 0) return (
    <span className="orbitron text-[13px] sm:text-[24px] font-bold rank-gold">1</span>
  )
  if (i === 1) return (
    <span className="orbitron text-[13px] sm:text-[24px] font-bold rank-silver">2</span>
  )
  if (i === 2) return (
    <span className="orbitron text-[13px] sm:text-[24px] font-bold rank-bronze">3</span>
  )
  return (
    <span className="orbitron text-[13px] sm:text-[24px] font-bold text-retro-muted">{i + 1}</span>
  )
}

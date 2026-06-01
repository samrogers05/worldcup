'use client'

import { useEffect, useState } from 'react'
import { TeamNameBadge } from '@/components/TeamBadge'
import PixelPlayer from '@/components/PixelPlayer'
import { getTeamData } from '@/lib/teams'
import type { GroupStandingsData, UserGroupStandings, StandingsRow } from './page'

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// Returns the set of team names that are "top 8 third place" for a given user
function getTop8ThirdPlaces(groupStandingsData: GroupStandingsData[], userId: string): Set<string> {
  const thirds: StandingsRow[] = []
  for (const { userStandings } of groupStandingsData) {
    const user = userStandings.find(u => u.userId === userId)
    if (user?.rows[2]) thirds.push(user.rows[2])
  }
  thirds.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd - a.gd)
  return new Set(thirds.slice(0, 8).map(r => r.team))
}

// ----------------------------------------------------------------
// Full standings table for one user
// ----------------------------------------------------------------

function UserStandingsTable({
  standings,
  top8ThirdPlaces,
}: {
  standings: UserGroupStandings
  top8ThirdPlaces: Set<string>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pitch-border">
            {['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((h, i) => (
              <th
                key={h}
                className={`py-2 text-[20px] text-retro-muted font-bold uppercase tracking-wider ${
                  i === 0 ? 'text-left w-6' :
                  i === 1 ? 'text-left' :
                  i === 9 ? 'text-right' :
                  'text-center'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.rows.map((row, i) => (
            <StandingsRowComp
              key={row.team}
              row={row}
              position={i + 1}
              isTop8Third={i === 2 && top8ThirdPlaces.has(row.team)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StandingsRowComp({
  row,
  position,
  isTop8Third = false,
}: {
  row: StandingsRow
  position: number
  isTop8Third?: boolean
}) {
  const isGreen  = position <= 2
  const isYellow = position === 3 && isTop8Third

  const rowStyle = isGreen
    ? { background: 'rgba(0,255,135,0.06)', borderLeft: '2px solid rgba(0,255,135,0.35)' }
    : isYellow
    ? { background: 'rgba(255,215,0,0.06)', borderLeft: '2px solid rgba(255,215,0,0.35)' }
    : {}

  const posColor = isGreen ? '#00ff87' : isYellow ? '#ffd700' : '#4a6a8a'
  const ptsColor = isGreen ? '#00ff87' : isYellow ? '#ffd700' : '#e8f4fd'

  return (
    <tr className="border-b border-pitch-border transition-colors" style={rowStyle}>
      <td className="py-2.5 pl-4 pr-6 orbitron text-[24px] font-bold" style={{ color: posColor }}>{position}</td>
      <td className="py-2.5">
        <TeamNameBadge name={row.team} textSize="text-[32px]" flagSize="w-14" gap="gap-5" />
      </td>
      <td className="py-2.5 text-center orbitron text-[24px] text-retro-muted">{row.played}</td>
      <td className="py-2.5 text-center orbitron text-[24px] text-retro-white">{row.won}</td>
      <td className="py-2.5 text-center orbitron text-[24px] text-retro-muted">{row.drawn}</td>
      <td className="py-2.5 text-center orbitron text-[24px] text-retro-muted">{row.lost}</td>
      <td className="py-2.5 text-center orbitron text-[24px] text-retro-muted">{row.gf}</td>
      <td className="py-2.5 text-center orbitron text-[24px] text-retro-muted">{row.ga}</td>
      <td className={`py-2.5 text-center orbitron text-[24px] font-bold ${
        row.gd > 0 ? 'text-neon' : row.gd < 0 ? 'text-retro-red' : 'text-retro-muted'
      }`}>
        {row.gd > 0 ? `+${row.gd}` : row.gd}
      </td>
      <td className="py-2.5 pr-4 text-right orbitron text-[28px] font-bold" style={{ color: ptsColor }}>{row.pts}</td>
    </tr>
  )
}

// ----------------------------------------------------------------
// Side-by-side: positions as rows, users as columns
// ----------------------------------------------------------------

function SideBySideTable({
  userStandings,
  top8ByUser,
}: {
  userStandings: UserGroupStandings[]
  top8ByUser: Map<string, Set<string>>
}) {
  if (userStandings.length === 0) {
    return (
      <p className="text-retro-muted text-xs text-center py-8 uppercase tracking-wide">
        No predictions for this group yet.
      </p>
    )
  }

  const positions = [0, 1, 2, 3]
  const posLabels = ['1ST', '2ND', '3RD', '4TH']

  return (
    <div className="overflow-x-auto">
      <table className="text-sm min-w-full">
        <thead>
          <tr className="border-b border-pitch-border">
            <th className="py-2.5 pr-4 text-left text-[10px] text-retro-muted font-bold uppercase tracking-wider sticky left-0"
              style={{ background: '#0d1f3c' }}>
              Pos
            </th>
            {userStandings.map(u => (
              <th key={u.userId}
                className="py-2.5 px-3 text-[10px] text-retro-muted font-bold uppercase tracking-wider text-center min-w-[110px] whitespace-nowrap">
                {u.userName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map(pos => (
            <tr key={pos} className="border-b border-pitch-border">
              <td
                className="py-3 pr-4 orbitron text-xs font-bold sticky left-0"
                style={{ background: '#0d1f3c', color: pos < 2 ? '#00ff87' : '#4a6a8a' }}
              >
                {posLabels[pos]}
              </td>
              {userStandings.map(u => {
                const row = u.rows[pos]
                const isGreen  = pos < 2
                const isYellow = pos === 2 && !!row && (top8ByUser.get(u.userId)?.has(row.team) ?? false)
                const cellStyle = isGreen
                  ? { background: 'rgba(0,255,135,0.06)' }
                  : isYellow
                  ? { background: 'rgba(255,215,0,0.06)' }
                  : {}
                return (
                  <td key={u.userId} className="py-3 px-3 text-center" style={cellStyle}>
                    {row ? (
                      <div className="flex flex-col items-center gap-1">
                        <PixelPlayer
                          jersey={getTeamData(row.team).jersey}
                          shorts={getTeamData(row.team).shorts}
                          socks={getTeamData(row.team).socks}
                          px={3}
                        />
                        <TeamNameBadge name={row.team} className="justify-center" />
                      </div>
                    ) : (
                      <span className="text-pitch-border text-xs">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-retro-muted mt-3 px-1 uppercase tracking-wide">
        Green = top 2 advance · Gold = top-8 third place
      </p>
    </div>
  )
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

type ViewMode = 'sideBySide' | 'oneUser'

export default function StandingsClient({
  groupStandingsData,
  lockTime,
}: {
  groupStandingsData: GroupStandingsData[]
  lockTime: string | null
}) {
  const [activeGroup, setActiveGroup]       = useState('A')
  const [viewMode, setViewMode]             = useState<ViewMode>('oneUser')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId]   = useState<string | null>(null)

  const isLocked = lockTime ? new Date() >= new Date(lockTime) : false

  useEffect(() => { setCurrentUserId(localStorage.getItem('wc_user_id')) }, [])

  const groupData    = groupStandingsData.find(g => g.group === activeGroup)
  const userStandings = groupData?.userStandings ?? []

  useEffect(() => {
    if (viewMode === 'oneUser') {
      if (!isLocked) {
        // Pre-lock: always force own predictions
        setSelectedUserId(currentUserId)
      } else if (!selectedUserId) {
        const mine = userStandings.find(u => u.userId === currentUserId)
        setSelectedUserId(mine?.userId ?? userStandings[0]?.userId ?? null)
      }
    }
  }, [viewMode, currentUserId, userStandings, selectedUserId, isLocked])

  const selectedUser = userStandings.find(u => u.userId === selectedUserId)

  // Precompute top-8 third-place sets for all users
  const allUserIds = Array.from(new Set(
    groupStandingsData.flatMap(g => g.userStandings.map(u => u.userId))
  ))
  const top8ByUser = new Map<string, Set<string>>(
    allUserIds.map(uid => [uid, getTop8ThirdPlaces(groupStandingsData, uid)])
  )
  const selectedTop8 = selectedUserId ? (top8ByUser.get(selectedUserId) ?? new Set<string>()) : new Set<string>()

  return (
    <div className="page-root">
      <header className="retro-header px-4 py-5">
        <div className="page-container">
          <a href="/" className="text-retro-muted text-[20px] uppercase tracking-widest hover:text-neon transition-colors mb-2 inline-block">
            ← Home
          </a>
          <h1 className="pixel-title-sm text-retro-white" style={{ fontSize: '20px' }}>Predicted Group Standings</h1>
        </div>
      </header>

      <div className="page-container py-6 space-y-5">
        {/* Group tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {GROUPS.map(g => {
            const data  = groupStandingsData.find(gd => gd.group === g)
            const count = data?.userStandings.length ?? 0
            return (
              <button
                key={g}
                onClick={() => { setActiveGroup(g); setSelectedUserId(null) }}
                className={`retro-tab relative shrink-0 w-10 h-10 font-bold text-sm ${activeGroup === g ? 'active' : ''}`}
              >
                {g}
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: '#00ff87', boxShadow: '0 0 6px #00ff87' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Header + view toggle */}
        <div className="flex items-center justify-between">
          <div>
            <span className="pixel-title-xs text-retro-white">Group {activeGroup}</span>
            <span className="orbitron text-[10px] text-retro-muted ml-3">
              {userStandings.length} prediction{userStandings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex rounded-sm overflow-hidden border border-pitch-border">
            <button
              onClick={() => isLocked && setViewMode('sideBySide')}
              disabled={!isLocked}
              title={!isLocked ? 'Available after group stage lock' : undefined}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                !isLocked
                  ? 'text-retro-muted opacity-40 cursor-not-allowed'
                  : viewMode === 'sideBySide'
                  ? 'bg-neon text-pitch-dark'
                  : 'text-retro-muted hover:text-retro-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('oneUser')}
              className={`px-3 py-1.5 border-l border-pitch-border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'oneUser' ? 'bg-neon text-pitch-dark' : 'text-retro-muted hover:text-retro-white'
              }`}
            >
              My Predictions
            </button>
          </div>
        </div>

        {/* Content card */}
        <div className="retro-card p-5">
          {viewMode === 'sideBySide' ? (
            <SideBySideTable userStandings={userStandings} top8ByUser={top8ByUser} />
          ) : (
            <>
              {userStandings.length > 0 ? (
                <>
                  {isLocked && (
                    <div className="mb-5">
                      <select
                        value={selectedUserId ?? ''}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-2 rounded-sm text-retro-white text-sm font-semibold outline-none uppercase tracking-wide"
                        style={{
                          background: '#000d00',
                          border: '1px solid #1e3a5f',
                          fontFamily: 'var(--font-orbitron-var), monospace',
                        }}
                      >
                        {userStandings.map(u => (
                          <option key={u.userId} value={u.userId} style={{ background: '#0d1f3c' }}>
                            {u.userName.toUpperCase()}{u.userId === currentUserId ? ' (YOU)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectedUser ? (
                    <UserStandingsTable standings={selectedUser} top8ThirdPlaces={selectedTop8} />
                  ) : (
                    <p className="text-retro-muted text-xs uppercase tracking-wide text-center py-4">
                      Select a player above.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-retro-muted text-xs uppercase tracking-wide text-center py-8">
                  No predictions for this group yet.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

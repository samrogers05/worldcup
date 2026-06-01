'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  checkAdminPassword,
  setAdminPassword,
  setGroupLockTime,
  setRoundOpen,
  saveGameResult,
  clearGameResult,
  upsertKnockoutGame,
} from '@/lib/admin-actions'
import type { AdminGame, AdminUser, AdminSettings } from './page'

// ----------------------------------------------------------------
// Session helpers (sessionStorage)
// ----------------------------------------------------------------

const SESSION_KEY = 'wc_admin_session'
const SESSION_TTL = 4 * 60 * 60 * 1000

function hasValidSession(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return false
    return Date.now() < JSON.parse(raw).expires
  } catch {
    return false
  }
}

function createSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expires: Date.now() + SESSION_TTL }))
}

// ----------------------------------------------------------------
// Shared UI primitives
// ----------------------------------------------------------------

function inputCls(extra = '') {
  return `border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${extra}`
}

function btnCls(variant: 'primary' | 'danger' | 'ghost' = 'primary', extra = '') {
  const base = 'text-sm font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  }
  return `${base} ${variants[variant]} ${extra}`
}

function StatusMsg({ msg }: { msg: string }) {
  if (!msg) return null
  const isErr = msg.toLowerCase().startsWith('fail') || msg.toLowerCase().includes('error') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('required')
  return (
    <span className={`text-xs font-medium ${isErr ? 'text-red-500' : 'text-green-600'}`}>
      {msg}
    </span>
  )
}

// ----------------------------------------------------------------
// Password gate
// ----------------------------------------------------------------

function PasswordGate({
  passwordIsSet,
  onAuthenticated,
}: {
  passwordIsSet: boolean
  onAuthenticated: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await checkAdminPassword(password)
    setLoading(false)
    if ('error' in result) { setError(result.error); return }
    createSession()
    onAuthenticated()
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    const result = await setAdminPassword(password)
    setLoading(false)
    if ('error' in result) { setError(result.error); return }
    createSession()
    onAuthenticated()
  }

  const isSetup = !passwordIsSet

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {isSetup ? 'Admin Setup' : 'Admin Panel'}
          </h1>
          {isSetup && (
            <p className="text-gray-500 text-sm mt-1">Set a password to protect the admin panel.</p>
          )}
        </div>

        <form onSubmit={isSetup ? handleSetPassword : handleLogin} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder={isSetup ? 'Password (min 8 characters)' : 'Password'}
            autoFocus
            disabled={loading}
            className={inputCls('w-full')}
          />
          {isSetup && (
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
              placeholder="Confirm password"
              disabled={loading}
              className={inputCls('w-full')}
            />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className={btnCls('primary', 'w-full py-2.5')}
          >
            {loading ? (isSetup ? 'Setting up…' : 'Signing in…') : (isSetup ? 'Set Password' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Settings section
// ----------------------------------------------------------------

function SettingsSection({
  settings,
  onSettingsChange,
}: {
  settings: AdminSettings
  onSettingsChange: (updated: Partial<AdminSettings>) => void
}) {
  // Convert UTC ISO to datetime-local value (display as UTC)
  const toLockInput = (iso: string) => iso ? iso.slice(0, 16) : ''
  const fromLockInput = (val: string) => val ? new Date(val + ':00Z').toISOString() : ''

  const [lockValue, setLockValue] = useState(toLockInput(settings.group_lock_time))
  const [lockMsg, setLockMsg] = useState('')
  const [savingLock, setSavingLock] = useState(false)

  const [roundMsgs, setRoundMsgs] = useState<Record<string, string>>({})
  const [savingRound, setSavingRound] = useState<string | null>(null)

  async function handleSaveLock(e: React.FormEvent) {
    e.preventDefault()
    if (!lockValue) return
    setSavingLock(true); setLockMsg('')
    const iso = fromLockInput(lockValue)
    const result = await setGroupLockTime(iso)
    setSavingLock(false)
    if ('error' in result) { setLockMsg(result.error); return }
    onSettingsChange({ group_lock_time: iso })
    setLockMsg('Saved!')
    setTimeout(() => setLockMsg(''), 3000)
  }

  async function handleToggleRound(round: 'R32' | 'R16' | 'QF' | 'SF' | 'F', currentlyOpen: boolean) {
    setSavingRound(round)
    setRoundMsgs(prev => ({ ...prev, [round]: '' }))
    const result = await setRoundOpen(round, !currentlyOpen)
    setSavingRound(null)
    if ('error' in result) {
      setRoundMsgs(prev => ({ ...prev, [round]: result.error }))
      return
    }
    const keyMap: Record<string, keyof AdminSettings> = {
      R32: 'r32_predictions_open', R16: 'r16_predictions_open',
      QF: 'qf_predictions_open', SF: 'sf_predictions_open', F: 'f_predictions_open',
    }
    onSettingsChange({ [keyMap[round]]: !currentlyOpen })
    setRoundMsgs(prev => ({ ...prev, [round]: !currentlyOpen ? 'Opened' : 'Closed' }))
    setTimeout(() => setRoundMsgs(prev => ({ ...prev, [round]: '' })), 3000)
  }

  const rounds: { key: 'R32' | 'R16' | 'QF' | 'SF' | 'F'; label: string; open: boolean }[] = [
    { key: 'R32', label: 'Round of 32', open: settings.r32_predictions_open },
    { key: 'R16', label: 'Round of 16', open: settings.r16_predictions_open },
    { key: 'QF',  label: 'Quarter-finals', open: settings.qf_predictions_open },
    { key: 'SF',  label: 'Semi-finals', open: settings.sf_predictions_open },
    { key: 'F',   label: 'Final', open: settings.f_predictions_open },
  ]

  return (
    <div className="space-y-6">
      {/* Group lock time */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Group Stage Lock</h3>
        <p className="text-xs text-gray-500 mb-4">After this time users can no longer submit group stage predictions. Enter in UTC.</p>
        <form onSubmit={handleSaveLock} className="flex items-center gap-3 flex-wrap">
          <input
            type="datetime-local"
            value={lockValue}
            onChange={e => setLockValue(e.target.value)}
            className={inputCls()}
          />
          <span className="text-xs text-gray-400">UTC</span>
          <button type="submit" disabled={savingLock || !lockValue} className={btnCls('primary')}>
            {savingLock ? 'Saving…' : 'Save'}
          </button>
          <StatusMsg msg={lockMsg} />
        </form>
        {settings.group_lock_time && (
          <p className="text-xs text-gray-400 mt-2">
            Current: {new Date(settings.group_lock_time).toUTCString()}
          </p>
        )}
      </div>

      {/* Knockout round toggles */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Knockout Predictions</h3>
        <div className="space-y-3">
          {rounds.map(r => (
            <div key={r.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{r.label}</span>
              <div className="flex items-center gap-3">
                <StatusMsg msg={roundMsgs[r.key] ?? ''} />
                <button
                  onClick={() => handleToggleRound(r.key, r.open)}
                  disabled={savingRound === r.key}
                  className={btnCls(r.open ? 'danger' : 'primary')}
                >
                  {savingRound === r.key ? '…' : r.open ? 'Close' : 'Open'}
                </button>
                <span className={`w-16 text-xs font-medium text-right ${r.open ? 'text-green-600' : 'text-gray-400'}`}>
                  {r.open ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Group results section
// ----------------------------------------------------------------

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

function GroupResultsSection({
  games,
  onGameUpdated,
}: {
  games: AdminGame[]
  onGameUpdated: (id: string, home: number | null, away: number | null) => void
}) {
  const [activeGroup, setActiveGroup] = useState('A')
  const groupGames = games.filter(g => g.stage === 'group' && g.group_name === activeGroup)

  return (
    <div className="space-y-4">
      {/* Group tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {GROUPS.map(g => {
          const gGames = games.filter(gm => gm.stage === 'group' && gm.group_name === g)
          const done = gGames.filter(gm => gm.actual_home !== null).length
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`relative shrink-0 w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                activeGroup === g ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-green-400'
              }`}
            >
              {g}
              {done > 0 && done < gGames.length && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
              )}
              {done === gGames.length && gGames.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-1">
        <h3 className="font-semibold text-gray-900 mb-3">Group {activeGroup} Results</h3>
        {groupGames.map(game => (
          <GameResultRow key={game.id} game={game} onSaved={onGameUpdated} />
        ))}
      </div>
    </div>
  )
}

function GameResultRow({
  game,
  onSaved,
}: {
  game: AdminGame
  onSaved: (id: string, home: number | null, away: number | null) => void
}) {
  const [home, setHome] = useState(game.actual_home !== null ? String(game.actual_home) : '')
  const [away, setAway] = useState(game.actual_away !== null ? String(game.actual_away) : '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const kickoff = game.kickoff_time
    ? new Date(game.kickoff_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : ''

  async function handleSave() {
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a)) { setMsg('Enter both scores.'); return }
    setSaving(true); setMsg('')
    const result = await saveGameResult(game.id, h, a)
    setSaving(false)
    if ('error' in result) { setMsg(result.error); return }
    onSaved(game.id, h, a)
    setMsg('Saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleClear() {
    setSaving(true); setMsg('')
    const result = await clearGameResult(game.id)
    setSaving(false)
    if ('error' in result) { setMsg(result.error); return }
    setHome(''); setAway('')
    onSaved(game.id, null, null)
    setMsg('Cleared')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 w-16 shrink-0">{kickoff}</span>
        <span className="text-sm text-gray-900 flex-1 text-right truncate">{game.home_team}</span>
        <div className="flex items-center gap-1">
          <ScoreInput value={home} onChange={setHome} />
          <span className="text-gray-400 text-xs">–</span>
          <ScoreInput value={away} onChange={setAway} />
        </div>
        <span className="text-sm text-gray-900 flex-1 truncate">{game.away_team}</span>
        <div className="flex items-center gap-2 ml-auto">
          <StatusMsg msg={msg} />
          {game.actual_home !== null && (
            <button onClick={handleClear} disabled={saving} className={btnCls('ghost')}>
              Clear
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className={btnCls('primary')}>
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      onChange={e => {
        const n = parseInt(e.target.value, 10)
        if (e.target.value === '') { onChange(''); return }
        if (!isNaN(n) && n >= 0 && n <= 20) onChange(String(n))
      }}
      className="w-10 h-8 text-center text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500
        [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  )
}

// ----------------------------------------------------------------
// Knockout section
// ----------------------------------------------------------------

const KNOCKOUT_ROUNDS: { key: 'R32' | 'R16' | 'QF' | 'SF' | 'F'; label: string; matchCount: number }[] = [
  { key: 'R32', label: 'Round of 32', matchCount: 32 },
  { key: 'R16', label: 'Round of 16', matchCount: 16 },
  { key: 'QF',  label: 'Quarter-finals', matchCount: 8 },
  { key: 'SF',  label: 'Semi-finals', matchCount: 4 },
  { key: 'F',   label: 'Final', matchCount: 1 },
]

function KnockoutSection({
  games,
  settings,
  onGameAdded,
  onGameUpdated,
}: {
  games: AdminGame[]
  settings: AdminSettings
  onGameAdded: (game: AdminGame) => void
  onGameUpdated: (id: string, updates: Partial<AdminGame>) => void
}) {
  const [activeRound, setActiveRound] = useState<'R32' | 'R16' | 'QF' | 'SF' | 'F'>('R32')
  const roundGames = games.filter(g => g.stage === activeRound)

  const openKey: Record<string, keyof AdminSettings> = {
    R32: 'r32_predictions_open', R16: 'r16_predictions_open',
    QF: 'qf_predictions_open', SF: 'sf_predictions_open', F: 'f_predictions_open',
  }
  const isOpen = settings[openKey[activeRound]] as boolean

  return (
    <div className="space-y-4">
      {/* Round tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {KNOCKOUT_ROUNDS.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveRound(r.key)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRound === r.key ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-green-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {KNOCKOUT_ROUNDS.find(r => r.key === activeRound)?.label}
          </h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            Predictions {isOpen ? 'open' : 'closed'}
          </span>
        </div>

        {roundGames.length === 0 ? (
          <p className="text-sm text-gray-400">No games added yet.</p>
        ) : (
          <div className="space-y-1">
            {roundGames.map(game => (
              <KnockoutGameRow key={game.id} game={game} onUpdated={onGameUpdated} />
            ))}
          </div>
        )}

        <AddKnockoutGameForm
          stage={activeRound}
          nextMatchNumber={101 + games.filter(g => g.stage === activeRound).length}
          onAdded={onGameAdded}
        />
      </div>
    </div>
  )
}

function KnockoutGameRow({
  game,
  onUpdated,
}: {
  game: AdminGame
  onUpdated: (id: string, updates: Partial<AdminGame>) => void
}) {
  const [homeTeam, setHomeTeam] = useState(game.home_team)
  const [awayTeam, setAwayTeam] = useState(game.away_team)
  const [home, setHome] = useState(game.actual_home !== null ? String(game.actual_home) : '')
  const [away, setAway] = useState(game.actual_away !== null ? String(game.actual_away) : '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSave() {
    const h = home !== '' ? parseInt(home, 10) : null
    const a = away !== '' ? parseInt(away, 10) : null
    setSaving(true); setMsg('')
    const result = await upsertKnockoutGame(
      game.id, game.stage as 'R32' | 'R16' | 'QF' | 'SF' | 'F',
      homeTeam, awayTeam, game.kickoff_time, h, a, game.match_number,
    )
    setSaving(false)
    if ('error' in result) { setMsg(result.error); return }
    onUpdated(game.id, { home_team: homeTeam, away_team: awayTeam, actual_home: h, actual_away: a })
    setMsg('Saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={homeTeam}
          onChange={e => setHomeTeam(e.target.value)}
          className={inputCls('flex-1 min-w-[100px]')}
          placeholder="Home team"
        />
        <div className="flex items-center gap-1 shrink-0">
          <ScoreInput value={home} onChange={setHome} />
          <span className="text-gray-400 text-xs">–</span>
          <ScoreInput value={away} onChange={setAway} />
        </div>
        <input
          value={awayTeam}
          onChange={e => setAwayTeam(e.target.value)}
          className={inputCls('flex-1 min-w-[100px]')}
          placeholder="Away team"
        />
        <div className="flex items-center gap-2">
          <StatusMsg msg={msg} />
          <button onClick={handleSave} disabled={saving} className={btnCls('primary')}>
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddKnockoutGameForm({
  stage,
  nextMatchNumber,
  onAdded,
}: {
  stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F'
  nextMatchNumber: number
  onAdded: (game: AdminGame) => void
}) {
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!homeTeam.trim() || !awayTeam.trim()) { setMsg('Both team names required.'); return }
    setSaving(true); setMsg('')
    const result = await upsertKnockoutGame(
      null, stage, homeTeam, awayTeam, null, null, null, nextMatchNumber,
    )
    setSaving(false)
    if ('error' in result) { setMsg(result.error); return }
    onAdded({
      id: result.id!,
      stage: stage as AdminGame['stage'],
      group_name: null,
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      kickoff_time: null,
      actual_home: null,
      actual_away: null,
      match_number: nextMatchNumber,
    })
    setHomeTeam(''); setAwayTeam('')
  }

  return (
    <form onSubmit={handleAdd} className="pt-3 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-2">Add game</p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={homeTeam}
          onChange={e => setHomeTeam(e.target.value)}
          placeholder="Home team"
          className={inputCls('flex-1 min-w-[120px]')}
        />
        <span className="text-gray-400 text-xs shrink-0">vs</span>
        <input
          value={awayTeam}
          onChange={e => setAwayTeam(e.target.value)}
          placeholder="Away team"
          className={inputCls('flex-1 min-w-[120px]')}
        />
        <button type="submit" disabled={saving} className={btnCls('primary')}>
          {saving ? '…' : 'Add'}
        </button>
        <StatusMsg msg={msg} />
      </div>
    </form>
  )
}

// ----------------------------------------------------------------
// Users section
// ----------------------------------------------------------------

function UsersSection({ users }: { users: AdminUser[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Registered Users</h3>
        <span className="text-xs text-gray-400">{users.length} total</span>
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-gray-400">No users registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Joined</th>
                <th className="pb-2 font-medium text-right">Predictions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="py-2 font-medium text-gray-900">{u.name}</td>
                  <td className="py-2 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2 text-right text-gray-700">{u.predictionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

type Tab = 'settings' | 'results' | 'knockout' | 'users'

export default function AdminClient({
  games: initialGames,
  users,
  settings: initialSettings,
}: {
  games: AdminGame[]
  users: AdminUser[]
  settings: AdminSettings
}) {
  const [mounted, setMounted] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [tab, setTab] = useState<Tab>('settings')
  const [games, setGames] = useState<AdminGame[]>(initialGames)
  const [settings, setSettings] = useState<AdminSettings>(initialSettings)

  useEffect(() => {
    setMounted(true)
    if (hasValidSession()) setAuthenticated(true)
  }, [])

  const handleGameResultUpdated = useCallback((id: string, home: number | null, away: number | null) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, actual_home: home, actual_away: away } : g))
  }, [])

  const handleKnockoutGameAdded = useCallback((game: AdminGame) => {
    setGames(prev => [...prev, game])
  }, [])

  const handleKnockoutGameUpdated = useCallback((id: string, updates: Partial<AdminGame>) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }, [])

  const handleSettingsChange = useCallback((updated: Partial<AdminSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }))
  }, [])

  if (!mounted) return null

  if (!authenticated) {
    return (
      <PasswordGate
        passwordIsSet={settings.passwordIsSet}
        onAuthenticated={() => setAuthenticated(true)}
      />
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'settings', label: 'Settings' },
    { key: 'results',  label: 'Group Results' },
    { key: 'knockout', label: 'Knockout' },
    { key: 'users',    label: 'Users' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-4 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <a href="/" className="text-green-300 text-sm hover:text-white mb-1 inline-block">← Home</a>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthenticated(false) }}
            className="text-green-300 hover:text-white text-sm"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {tab === 'settings' && (
          <SettingsSection settings={settings} onSettingsChange={handleSettingsChange} />
        )}
        {tab === 'results' && (
          <GroupResultsSection games={games} onGameUpdated={handleGameResultUpdated} />
        )}
        {tab === 'knockout' && (
          <KnockoutSection
            games={games}
            settings={settings}
            onGameAdded={handleKnockoutGameAdded}
            onGameUpdated={handleKnockoutGameUpdated}
          />
        )}
        {tab === 'users' && <UsersSection users={users} />}
      </main>
    </div>
  )
}

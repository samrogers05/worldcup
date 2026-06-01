'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import NameRegistrationModal from '@/components/NameRegistrationModal'
import PixelIcon from '@/components/PixelIcon'
import type { IconName } from '@/components/PixelIcon'
import type { LeaderboardEntry } from '@/lib/queries'

type Props = {
  leaderboard: LeaderboardEntry[]
}

export default function HomeClient({ leaderboard }: Props) {
  const [userId, setUserId]     = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    setUserId(localStorage.getItem('wc_user_id'))
    setUserName(localStorage.getItem('wc_user_name'))
  }, [])

  function handleRegistered(id: string, name: string) {
    localStorage.setItem('wc_user_id', id)
    localStorage.setItem('wc_user_name', name)
    setUserId(id)
    setUserName(name)
  }

  const userIndex   = userId ? leaderboard.findIndex(e => e.id === userId) : -1
  const userEntry   = userIndex >= 0 ? leaderboard[userIndex] : null
  const points      = userEntry?.points ?? 0
  const maxPossible = userEntry?.maxPossible ?? 0
  const rank        = userIndex >= 0 ? userIndex + 1 : null
  const top5        = leaderboard.slice(0, 5)

  return (
    <>
      {mounted && (!userId || !userName) && (
        <NameRegistrationModal onRegistered={handleRegistered} />
      )}

      <div className="page-root">

        {/* ── Header ── */}
        <header className="retro-header px-6 py-4 text-center">
          <p className="orbitron text-retro-muted text-[10px] uppercase tracking-[0.4em] mb-1">
            FIFA
          </p>
          <div
            className="orbitron font-black text-neon leading-none"
            style={{
              fontSize: 'clamp(24px, 5vw, 52px)',
              textShadow: '0 0 60px rgba(0,255,135,0.55), 0 0 20px rgba(0,255,135,0.8)',
              letterSpacing: '-0.02em',
            }}
          >
            2026
          </div>
          <h1
            className="pixel-title mt-2"
            style={{ fontSize: 'clamp(14px, 2vw, 20px)', color: '#ffd700', textShadow: '0 0 12px rgba(255,215,0,0.5)' }}
          >
            WORLD CUP
          </h1>
          <p className="orbitron text-retro-muted text-[9px] uppercase tracking-[0.3em] mt-1">
            Family Predictions
          </p>
        </header>

        {/* ── Content ── */}
        <main className="page-container py-4 space-y-4">

          {/* Row 1: Player card + Top Predictors, side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Player card */}
            <div className="retro-card p-4 pixel-corners">
              <p className="text-retro-muted text-[10px] uppercase tracking-[0.25em] mb-2">
                Player One
              </p>
              <h2 className="orbitron font-black text-xl tracking-wide text-retro-white truncate">
                {mounted && userName
                  ? userName.toUpperCase()
                  : <span className="text-pitch-border animate-pulse">LOADING...</span>}
              </h2>
              <div className="grid grid-cols-3 gap-4 mt-8">
                <BigStat label="POINTS"   value={points}                  color="#00ff87" />
                <BigStat label="RANK"     value={rank ? `#${rank}` : '—'} color="#e8f4fd" />
                <BigStat label="MAX LEFT" value={maxPossible}              color="#4a6a8a" />
              </div>
            </div>

            {/* Top Predictors */}
            <div className="retro-card p-4 flex flex-col">
              <h3 className="pixel-title-xs text-retro-muted uppercase tracking-widest mb-5 shrink-0">
                Top Predictors
              </h3>

              {top5.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-retro-muted text-xs uppercase tracking-wide text-center">
                    No scores yet —<br />predictions are open
                  </p>
                </div>
              ) : (
                <ol className="flex-1 space-y-1">
                  {top5.map((entry, i) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between py-3 border-b border-pitch-border last:border-0"
                    >
                      <span className="flex items-center gap-3">
                        <RankBadge i={i} />
                        <div>
                          <span className={`font-bold text-[13px] uppercase tracking-wide block ${
                            entry.id === userId ? 'text-neon' : 'text-retro-white'
                          }`}>
                            {entry.name}
                          </span>
                          {entry.id === userId && (
                            <span className="text-[9px] text-neon uppercase tracking-widest">You</span>
                          )}
                        </div>
                      </span>
                      <span className="orbitron text-[16px] font-black" style={{
                        color: i === 0 ? '#ffd700' : i === 1 ? '#b8c4d0' : i === 2 ? '#cd7f32' : '#e8f4fd'
                      }}>
                        {entry.points}
                        <span className="orbitron text-[9px] text-retro-muted font-normal ml-1">PTS</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="border-t border-pitch-border mt-4 pt-4 shrink-0">
                <Link
                  href="/leaderboard"
                  className="block text-center text-neon text-[11px] uppercase tracking-widest hover:text-neon-dim transition-colors py-1"
                >
                  View Full Leaderboard →
                </Link>
              </div>
            </div>

          </div>

          {/* Row 2: 2×2 nav grid */}
          <div className="grid grid-cols-2 gap-6">
            <NavTile href="/predict"     icon="ball"   category="PLAY"     title="Make Predictions" accent="#00ff87" />
            <NavTile href="/leaderboard" icon="trophy" category="RANKINGS" title="Leaderboard"      accent="#ffd700" />
            <NavTile href="/community"   icon="eye"    category="BROWSE"   title="Community Picks"  accent="#b8c4d0" />
            <NavTile href="/standings"   icon="table"  category="TABLES"   title="Group Standings"  accent="#cd7f32" />
          </div>

        </main>

        <footer className="page-container py-4 text-right">
          <a href="/admin" className="text-retro-muted text-[10px] uppercase tracking-widest hover:text-neon transition-colors">
            Admin
          </a>
        </footer>
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function BigStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="retro-card p-3 text-center">
      <div
        className="orbitron text-2xl font-black leading-none mb-1"
        style={{ color, textShadow: `0 0 20px ${color}55` }}
      >
        {value}
      </div>
      <div className="text-retro-muted text-[9px] uppercase tracking-[0.2em]">{label}</div>
    </div>
  )
}

function NavTile({
  href, icon, category, title, accent,
}: {
  href: string
  icon: IconName
  category: string
  title: string
  accent: string
}) {
  return (
    <Link
      href={href}
      className="retro-card flex flex-col justify-between p-5 h-44 group transition-all duration-150 overflow-hidden"
      style={{ borderColor: '#1e3a5f' }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = accent
        el.style.boxShadow = `0 0 32px ${accent}30`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = '#1e3a5f'
        el.style.boxShadow = ''
      }}
    >
      <PixelIcon icon={icon} color={accent} darkColor="#060d1e" px={7} />
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>
          {category}
        </div>
        <div className="text-retro-white font-bold text-2xl leading-tight group-hover:text-white transition-colors">
          {title}
        </div>
      </div>
    </Link>
  )
}

function RankBadge({ i }: { i: number }) {
  const configs = [
    { bg: 'rgba(255,215,0,0.15)',   color: '#ffd700', border: 'rgba(255,215,0,0.4)' },
    { bg: 'rgba(184,196,208,0.15)', color: '#b8c4d0', border: 'rgba(184,196,208,0.4)' },
    { bg: 'rgba(205,127,50,0.15)',  color: '#cd7f32', border: 'rgba(205,127,50,0.4)' },
  ]
  const cfg = configs[i] ?? { bg: '#0d1f3c', color: '#4a6a8a', border: '#1e3a5f' }

  return (
    <span
      className="w-10 h-10 flex items-center justify-center rounded-sm text-sm font-black orbitron shrink-0"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {i + 1}
    </span>
  )
}

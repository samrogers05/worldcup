'use client'

import { useState } from 'react'
import { registerUser } from '@/lib/actions'

type Props = {
  onRegistered: (id: string, name: string) => void
}

export default function NameRegistrationModal({ onRegistered }: Props) {
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!password) { setError('Please enter a password.'); return }
    setLoading(true)
    setError('')
    const result = await registerUser(name, password)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      onRegistered(result.id, result.name)
    }
  }

  const inputStyle = {
    background: '#000d00',
    border: '1px solid #1e3a5f',
    fontFamily: 'var(--font-orbitron-var), monospace',
    letterSpacing: '0.06em',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,30,0.92)' }}>
      <div className="retro-card w-full max-w-sm p-8 pixel-corners"
        style={{ boxShadow: '0 0 40px rgba(0,255,135,0.2), 0 0 0 1px #1e3a5f' }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 select-none">⚽</div>
          <h1 className="pixel-title text-neon mb-1" style={{ fontSize: 12 }}>WORLD CUP</h1>
          <h2 className="pixel-title text-retro-white mb-3" style={{ fontSize: 10 }}>2026</h2>
          <p className="text-retro-muted text-xs uppercase tracking-widest">Family Predictions</p>
        </div>

        <div className="border-t border-pitch-border mb-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name"
              className="block text-retro-muted text-[10px] uppercase tracking-widest mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="e.g. Sam"
              maxLength={50}
              autoFocus
              disabled={loading}
              className="w-full px-4 py-3 text-retro-white text-sm font-semibold rounded-sm outline-none"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#00ff87'; e.target.style.boxShadow = '0 0 10px rgba(0,255,135,0.2)' }}
              onBlur={e => { e.target.style.borderColor = '#1e3a5f'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label htmlFor="password"
              className="block text-retro-muted text-[10px] uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-3 text-retro-white text-sm font-semibold rounded-sm outline-none"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#00ff87'; e.target.style.boxShadow = '0 0 10px rgba(0,255,135,0.2)' }}
              onBlur={e => { e.target.style.borderColor = '#1e3a5f'; e.target.style.boxShadow = 'none' }}
            />
            <p className="text-retro-muted text-[10px] mt-1.5 tracking-wide">
              New name? A new account will be created.
            </p>
          </div>

          {error && (
            <p className="text-retro-red text-[10px] uppercase tracking-wide">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !password}
            className="retro-btn w-full"
          >
            {loading ? 'LOADING...' : 'PRESS START'}
          </button>
        </form>
      </div>
    </div>
  )
}

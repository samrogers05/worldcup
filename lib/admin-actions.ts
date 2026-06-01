'use server'

import bcrypt from 'bcryptjs'
import { getSupabaseAdminClient, getSupabaseServerClient } from './supabase'

type Result = { success: true } | { error: string }

// ----------------------------------------------------------------
// Authentication
// ----------------------------------------------------------------

export async function checkAdminPassword(password: string): Promise<Result> {
  if (!password) return { error: 'Enter a password.' }

  const supabase = getSupabaseServerClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'admin_password_hash')
    .single() as unknown as { data: { value: string } | null }

  if (!data?.value) return { error: 'Admin password not set.' }

  const match = await bcrypt.compare(password, data.value)
  if (!match) return { error: 'Incorrect password.' }

  return { success: true }
}

export async function setAdminPassword(password: string): Promise<Result> {
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const hash = await bcrypt.hash(password, 12)
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from('settings')
    .update({ value: hash })
    .eq('key', 'admin_password_hash')

  if (error) return { error: 'Failed to set password.' }
  return { success: true }
}

// ----------------------------------------------------------------
// Tournament settings
// ----------------------------------------------------------------

export async function setGroupLockTime(isoTime: string): Promise<Result> {
  if (!isoTime || isNaN(new Date(isoTime).getTime())) return { error: 'Invalid datetime.' }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('settings')
    .update({ value: isoTime })
    .eq('key', 'group_lock_time')

  if (error) return { error: 'Failed to update lock time.' }
  return { success: true }
}

export async function setRoundOpen(
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'F',
  open: boolean,
): Promise<Result> {
  const keyMap: Record<string, string> = {
    R32: 'r32_predictions_open',
    R16: 'r16_predictions_open',
    QF: 'qf_predictions_open',
    SF: 'sf_predictions_open',
    F: 'f_predictions_open',
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('settings')
    .update({ value: open ? 'true' : 'false' })
    .eq('key', keyMap[round])

  if (error) return { error: 'Failed to update.' }
  return { success: true }
}

// ----------------------------------------------------------------
// Game results
// ----------------------------------------------------------------

export async function saveGameResult(
  gameId: string,
  actualHome: number,
  actualAway: number,
): Promise<Result> {
  for (const v of [actualHome, actualAway]) {
    if (!Number.isInteger(v) || v < 0 || v > 20) return { error: 'Scores must be 0–20.' }
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('games')
    .update({ actual_home: actualHome, actual_away: actualAway })
    .eq('id', gameId)

  if (error) return { error: 'Failed to save result.' }
  return { success: true }
}

export async function clearGameResult(gameId: string): Promise<Result> {
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('games')
    .update({ actual_home: null, actual_away: null })
    .eq('id', gameId)

  if (error) return { error: 'Failed to clear result.' }
  return { success: true }
}

// ----------------------------------------------------------------
// Knockout game management
// ----------------------------------------------------------------

export async function upsertKnockoutGame(
  gameId: string | null,
  stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F',
  homeTeam: string,
  awayTeam: string,
  kickoffTime: string | null,
  actualHome: number | null,
  actualAway: number | null,
  matchNumber: number | null,
): Promise<Result & { id?: string }> {
  if (!homeTeam.trim() || !awayTeam.trim()) return { error: 'Both team names are required.' }

  for (const v of [actualHome, actualAway]) {
    if (v !== null && (!Number.isInteger(v) || v < 0 || v > 20)) {
      return { error: 'Scores must be 0–20.' }
    }
  }

  const supabase = getSupabaseAdminClient()

  if (gameId) {
    const { error } = await supabase
      .from('games')
      .update({
        home_team: homeTeam.trim(),
        away_team: awayTeam.trim(),
        kickoff_time: kickoffTime || null,
        actual_home: actualHome,
        actual_away: actualAway,
      })
      .eq('id', gameId)

    if (error) return { error: 'Failed to update game.' }
    return { success: true, id: gameId }
  } else {
    const { data, error } = await supabase
      .from('games')
      .insert({
        stage,
        home_team: homeTeam.trim(),
        away_team: awayTeam.trim(),
        kickoff_time: kickoffTime || null,
        actual_home: actualHome,
        actual_away: actualAway,
        match_number: matchNumber,
      })
      .select('id')
      .single() as unknown as { data: { id: string } | null; error: unknown }

    if (error || !data) return { error: 'Failed to create game.' }
    return { success: true, id: data.id }
  }
}

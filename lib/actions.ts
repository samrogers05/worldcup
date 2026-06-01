'use server'

import { getSupabaseServerClient } from './supabase'
import bcrypt from 'bcryptjs'

// ----------------------------------------------------------------
// Predictions
// ----------------------------------------------------------------

export type PredictionInput = {
  gameId: string
  predictedHome: number
  predictedAway: number
}

export async function savePredictions(
  userId: string,
  predictions: PredictionInput[],
): Promise<{ success: true } | { error: string }> {
  if (!userId) return { error: 'Not registered.' }
  if (predictions.length === 0) return { success: true }

  for (const p of predictions) {
    if (
      !Number.isInteger(p.predictedHome) || p.predictedHome < 0 || p.predictedHome > 20 ||
      !Number.isInteger(p.predictedAway) || p.predictedAway < 0 || p.predictedAway > 20
    ) {
      return { error: 'Scores must be whole numbers between 0 and 20.' }
    }
  }

  const supabase = getSupabaseServerClient()

  // Enforce group lock server-side
  const { data: lockSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'group_lock_time')
    .single() as unknown as { data: { value: string } | null }

  if (lockSetting && new Date() >= new Date(lockSetting.value)) {
    return { error: 'Group stage predictions are locked.' }
  }

  const { error } = await supabase
    .from('predictions')
    .upsert(
      predictions.map(p => ({
        user_id: userId,
        game_id: p.gameId,
        predicted_home: p.predictedHome,
        predicted_away: p.predictedAway,
      })),
      { onConflict: 'user_id,game_id' },
    )

  if (error) return { error: 'Failed to save. Please try again.' }
  return { success: true }
}

export async function saveKnockoutPredictions(
  userId: string,
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'F',
  predictions: PredictionInput[],
): Promise<{ success: true } | { error: string }> {
  if (!userId) return { error: 'Not registered.' }
  if (predictions.length === 0) return { success: true }

  for (const p of predictions) {
    if (
      !Number.isInteger(p.predictedHome) || p.predictedHome < 0 || p.predictedHome > 20 ||
      !Number.isInteger(p.predictedAway) || p.predictedAway < 0 || p.predictedAway > 20
    ) {
      return { error: 'Scores must be whole numbers between 0 and 20.' }
    }
  }

  const keyMap: Record<string, string> = {
    R32: 'r32_predictions_open', R16: 'r16_predictions_open',
    QF: 'qf_predictions_open', SF: 'sf_predictions_open', F: 'f_predictions_open',
  }

  const supabase = getSupabaseServerClient()

  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', keyMap[round])
    .single() as unknown as { data: { value: string } | null }

  if (!setting || setting.value !== 'true') {
    return { error: `${round} predictions are not open.` }
  }

  const { error } = await supabase
    .from('predictions')
    .upsert(
      predictions.map(p => ({
        user_id: userId,
        game_id: p.gameId,
        predicted_home: p.predictedHome,
        predicted_away: p.predictedAway,
      })),
      { onConflict: 'user_id,game_id' },
    )

  if (error) return { error: 'Failed to save. Please try again.' }
  return { success: true }
}

export async function registerUser(
  name: string,
  password: string,
): Promise<{ id: string; name: string } | { error: string }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Please enter your name.' }
  if (trimmed.length > 50) return { error: 'Name must be 50 characters or less.' }
  if (!password || password.length < 4) return { error: 'Password must be at least 4 characters.' }

  const supabase = getSupabaseServerClient()

  // Check if name already exists (case-insensitive)
  const { data: existing } = await supabase
    .from('users')
    .select('id, name, password')
    .ilike('name', trimmed)
    .maybeSingle() as unknown as { data: { id: string; name: string; password: string | null } | null }

  if (existing) {
    if (!existing.password) {
      // No password set yet — save this as their password and log in
      const hash = await bcrypt.hash(password, 10)
      await supabase.from('users').update({ password: hash }).eq('id', existing.id)
      return { id: existing.id, name: existing.name }
    }
    const match = await bcrypt.compare(password, existing.password)
    if (!match) return { error: 'Incorrect password.' }
    return { id: existing.id, name: existing.name }
  }

  // Register path — hash password and create user
  const hash = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('users')
    .insert({ name: trimmed, password: hash })
    .select('id, name')
    .single() as unknown as { data: { id: string; name: string } | null; error: unknown }

  if (error || !data) {
    return { error: 'Something went wrong. Please try again.' }
  }

  return { id: data.id, name: data.name }
}

import type { AiCartridge, CartridgeSettings, Difficulty } from '../types/cartridge'

const savedCartridgesKey = 'prompt-arcade:saved-cartridges'
const settingsKey = 'prompt-arcade:settings'
const maxSavedCartridges = 20

const difficulties: Difficulty[] = ['chill', 'normal', 'spicy']

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function isCartridge(value: unknown): value is AiCartridge {
  if (!value || typeof value !== 'object') {
    return false
  }

  const cartridge = value as Partial<AiCartridge>

  return (
    typeof cartridge.id === 'string' &&
    typeof cartridge.createdAt === 'string' &&
    typeof cartridge.prompt === 'string' &&
    typeof cartridge.title === 'string' &&
    typeof cartridge.html === 'string' &&
    typeof cartridge.css === 'string' &&
    typeof cartridge.js === 'string' &&
    Array.isArray(cartridge.controls) &&
    Array.isArray(cartridge.tags)
  )
}

export function loadSettings(): CartridgeSettings {
  const stored = readJson<Partial<CartridgeSettings>>(settingsKey, {})
  const chaos = typeof stored.chaos === 'number' ? Math.min(100, Math.max(0, stored.chaos)) : 42
  const difficulty = stored.difficulty && difficulties.includes(stored.difficulty) ? stored.difficulty : 'normal'

  return {
    chaos,
    difficulty,
  }
}

export function saveSettings(settings: CartridgeSettings) {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings))
}

export function loadSavedCartridges() {
  const stored = readJson<unknown[]>(savedCartridgesKey, [])

  return Array.isArray(stored) ? stored.filter(isCartridge).slice(0, maxSavedCartridges) : []
}

export function persistSavedCartridges(cartridges: AiCartridge[]) {
  window.localStorage.setItem(savedCartridgesKey, JSON.stringify(cartridges.slice(0, maxSavedCartridges)))
}

export function upsertSavedCartridge(cartridge: AiCartridge) {
  const current = loadSavedCartridges()
  const next = [cartridge, ...current.filter((saved) => saved.id !== cartridge.id)].slice(0, maxSavedCartridges)

  persistSavedCartridges(next)
  return next
}

export function markCartridgePlayed(id: string) {
  const now = new Date().toISOString()
  const next = loadSavedCartridges().map((cartridge) =>
    cartridge.id === id
      ? {
          ...cartridge,
          lastPlayedAt: now,
        }
      : cartridge,
  )

  persistSavedCartridges(next)
  return next
}

export function deleteSavedCartridge(id: string) {
  const next = loadSavedCartridges().filter((cartridge) => cartridge.id !== id)

  persistSavedCartridges(next)
  return next
}

import { cn } from '../lib/cn'
import type { CartridgeSettings, Difficulty } from '../types/cartridge'

interface SettingsPanelProps {
  settings: CartridgeSettings
  isLoading: boolean
  onSettingsChange: (settings: CartridgeSettings) => void
}

const difficultyOptions: Array<{ value: Difficulty; label: string; hint: string }> = [
  { value: 'chill', label: 'Chill', hint: 'forgiving' },
  { value: 'normal', label: 'Normal', hint: 'arcade' },
  { value: 'spicy', label: 'Spicy', hint: 'fast' },
]

export function SettingsPanel({ settings, isLoading, onSettingsChange }: SettingsPanelProps) {
  return (
    <section className="arcade-panel p-4 sm:p-5">
      <div className="mb-5">
        <p className="eyebrow">generator controls</p>
        <h2 className="text-xl font-black text-white">Tune the cartridge</h2>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="chaos" className="text-sm font-semibold text-slate-200">
            Chaos
          </label>
          <span className="rounded-md border border-amber-200/30 bg-amber-200/10 px-2 py-1 font-mono text-sm text-amber-100">
            {settings.chaos}
          </span>
        </div>
        <input
          id="chaos"
          type="range"
          min={0}
          max={100}
          value={settings.chaos}
          disabled={isLoading}
          onChange={(event) =>
            onSettingsChange({
              ...settings,
              chaos: Number(event.target.value),
            })
          }
          className="arcade-slider"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>stable</span>
          <span>unhinged</span>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-200">Difficulty</p>
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/25 p-1">
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isLoading}
              onClick={() =>
                onSettingsChange({
                  ...settings,
                  difficulty: option.value,
                })
              }
              className={cn(
                'rounded-md px-2 py-3 text-center transition focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:cursor-wait',
                settings.difficulty === option.value
                  ? 'bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(68,247,228,.28)]'
                  : 'text-slate-300 hover:bg-white/[.08] hover:text-white',
              )}
            >
              <span className="block text-sm font-black">{option.label}</span>
              <span className="block text-[11px]">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

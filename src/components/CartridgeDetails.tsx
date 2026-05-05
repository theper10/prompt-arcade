import type { AiCartridge } from '../types/cartridge'

interface CartridgeDetailsProps {
  cartridge: AiCartridge | null
  onSave: () => void
  onCopySummary: () => void
}

export function CartridgeDetails({ cartridge, onSave, onCopySummary }: CartridgeDetailsProps) {
  if (!cartridge) {
    return (
      <section className="arcade-panel p-4 sm:p-5">
        <p className="eyebrow">cartridge manifest</p>
        <div className="mt-8 rounded-lg border border-dashed border-white/15 bg-black/20 p-5 text-sm text-slate-400">
          No cartridge loaded yet. Generate a prompt to fill this slot with controls, goals, tags, and exportable game code.
        </div>
      </section>
    )
  }

  return (
    <section className="arcade-panel p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">cartridge manifest</p>
          <h2 className="mt-1 text-2xl font-black text-white">{cartridge.title}</h2>
          <p className="mt-2 text-sm text-cyan-100">{cartridge.subtitle}</p>
        </div>
        <span className="rounded-full border border-fuchsia-300/35 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold uppercase text-fuchsia-100">
          {cartridge.estimatedDifficulty}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{cartridge.description}</p>

      <dl className="mt-5 grid gap-4 text-sm">
        <div>
          <dt className="manifest-label">Objective</dt>
          <dd className="mt-1 text-slate-200">{cartridge.objective}</dd>
        </div>
        <div>
          <dt className="manifest-label">Win</dt>
          <dd className="mt-1 text-slate-200">{cartridge.winCondition}</dd>
        </div>
        <div>
          <dt className="manifest-label">Lose</dt>
          <dd className="mt-1 text-slate-200">{cartridge.loseCondition}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <p className="manifest-label">Controls</p>
        <ul className="mt-2 grid gap-2 text-sm text-slate-200">
          {cartridge.controls.map((control) => (
            <li key={control} className="rounded-md border border-white/10 bg-white/[.04] px-3 py-2">
              {control}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {cartridge.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onSave} className="secondary-button">
          Save
        </button>
        <button type="button" onClick={onCopySummary} className="secondary-button">
          Copy Summary
        </button>
      </div>
    </section>
  )
}

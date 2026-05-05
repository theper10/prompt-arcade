import { useState } from 'react'
import type { AiCartridge } from '../types/cartridge'

interface CartridgeDetailsProps {
  cartridge: AiCartridge | null
  onSave: () => void
  onCopySummary: () => void
}

export function CartridgeDetails({ cartridge, onSave, onCopySummary }: CartridgeDetailsProps) {
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)

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

      <div className="mt-5 rounded-lg border border-white/10 bg-black/20">
        <button
          type="button"
          onClick={() => setDiagnosticsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm font-bold text-white outline-none transition hover:bg-white/[.04] focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          Cartridge diagnostics
          <span className="font-mono text-xs text-cyan-100">{diagnosticsOpen ? 'Hide' : 'Show'}</span>
        </button>
        {diagnosticsOpen && (
          <div className="grid gap-3 border-t border-white/10 px-3 py-3 text-xs text-slate-300">
            <div className="grid grid-cols-3 gap-2">
              <span className="rounded-md bg-white/[.04] px-2 py-2">HTML {cartridge.html.length}</span>
              <span className="rounded-md bg-white/[.04] px-2 py-2">CSS {cartridge.css.length}</span>
              <span className="rounded-md bg-white/[.04] px-2 py-2">JS {cartridge.js.length}</span>
            </div>
            <div>
              <p className="manifest-label">Difficulty</p>
              <p className="mt-1">{cartridge.estimatedDifficulty}</p>
            </div>
            <div>
              <p className="manifest-label">Engine Notes</p>
              <p className="mt-1">{cartridge.engineNotes ?? 'No engine notes returned.'}</p>
            </div>
            <div>
              <p className="manifest-label">Warnings</p>
              {cartridge.qualityWarnings?.length ? (
                <ul className="mt-1 grid gap-1">
                  {cartridge.qualityWarnings.map((warning) => (
                    <li key={warning} className="rounded-md border border-amber-200/20 bg-amber-200/10 px-2 py-1 text-amber-100">
                      {warning}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-emerald-100">No quality warnings.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

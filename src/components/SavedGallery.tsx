import { useMemo, useState } from 'react'
import { downloadCartridgeHtml } from '../lib/download'
import type { AiCartridge } from '../types/cartridge'

interface SavedGalleryProps {
  savedCartridges: AiCartridge[]
  activeId?: string
  onLoad: (cartridge: AiCartridge) => void
  onClonePrompt: (prompt: string) => void
  onDelete: (id: string) => void
  onToast: (message: string, tone: 'success' | 'error' | 'info') => void
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return 'Saved'
  }
}

function matchesQuery(cartridge: AiCartridge, query: string) {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return true
  }

  return [cartridge.title, cartridge.prompt, cartridge.tags.join(' '), cartridge.estimatedDifficulty]
    .join(' ')
    .toLowerCase()
    .includes(normalized)
}

export function SavedGallery({
  savedCartridges,
  activeId,
  onLoad,
  onClonePrompt,
  onDelete,
  onToast,
}: SavedGalleryProps) {
  const [query, setQuery] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null)
  const filteredCartridges = useMemo(
    () => savedCartridges.filter((cartridge) => matchesQuery(cartridge, query)),
    [savedCartridges, query],
  )

  return (
    <section className="arcade-panel p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">saved cartridges</p>
          <h2 className="text-xl font-black text-white">Gallery</h2>
        </div>
        <span className="font-mono text-xs text-slate-400">{savedCartridges.length}/20</span>
      </div>

      <label className="sr-only" htmlFor="gallery-search">
        Search saved cartridges
      </label>
      <input
        id="gallery-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search title, prompt, tag..."
        className="mb-3 h-10 w-full rounded-lg border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-200/25"
      />

      {savedCartridges.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-5 text-sm text-slate-400">
          Saved cartridges will appear here for quick replays and exports.
        </div>
      ) : filteredCartridges.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-4 text-sm text-slate-400">
          No saved cartridges match that filter.
        </div>
      ) : (
        <div className="grid max-h-[820px] gap-2 overflow-y-auto pr-1">
          {filteredCartridges.map((cartridge) => {
            const confirmingDelete = deleteCandidate === cartridge.id

            return (
              <article
                key={cartridge.id}
                className="rounded-lg border border-white/10 bg-white/[.035] p-3 transition hover:border-cyan-200/45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-white">{cartridge.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{cartridge.prompt}</p>
                  </div>
                  {activeId === cartridge.id && (
                    <span className="shrink-0 rounded-full bg-cyan-300 px-2 py-1 text-[10px] font-black uppercase text-slate-950">
                      live
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cartridge.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag compact">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-3 grid gap-1 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between gap-2">
                    <span>Created {formatDate(cartridge.createdAt)}</span>
                    <span>{cartridge.estimatedDifficulty}</span>
                  </div>
                  {cartridge.lastPlayedAt && <span>Last played {formatDate(cartridge.lastPlayedAt)}</span>}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onLoad(cartridge)} className="mini-button">
                    Load
                  </button>
                  <button type="button" onClick={() => onClonePrompt(cartridge.prompt)} className="mini-button">
                    Clone Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadCartridgeHtml(cartridge)
                      onToast('Saved cartridge exported.', 'success')
                    }}
                    className="mini-button"
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmingDelete) {
                        onDelete(cartridge.id)
                        setDeleteCandidate(null)
                        return
                      }

                      setDeleteCandidate(cartridge.id)
                    }}
                    onBlur={() => window.setTimeout(() => setDeleteCandidate(null), 180)}
                    className="mini-button danger"
                  >
                    {confirmingDelete ? 'Confirm' : 'Delete'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

import { downloadCartridgeHtml } from '../lib/download'
import type { AiCartridge } from '../types/cartridge'

interface SavedGalleryProps {
  savedCartridges: AiCartridge[]
  activeId?: string
  onLoad: (cartridge: AiCartridge) => void
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

export function SavedGallery({ savedCartridges, activeId, onLoad, onDelete, onToast }: SavedGalleryProps) {
  return (
    <section className="arcade-panel p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">saved cartridges</p>
          <h2 className="text-xl font-black text-white">Gallery</h2>
        </div>
        <span className="font-mono text-xs text-slate-400">{savedCartridges.length}/20</span>
      </div>

      {savedCartridges.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-5 text-sm text-slate-400">
          Saved cartridges will appear here for quick replays and exports.
        </div>
      ) : (
        <div className="grid gap-3">
          {savedCartridges.map((cartridge) => (
            <article
              key={cartridge.id}
              className="rounded-lg border border-white/10 bg-white/[.035] p-3 transition hover:border-cyan-200/45"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">{cartridge.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{cartridge.prompt}</p>
                </div>
                {activeId === cartridge.id && (
                  <span className="rounded-full bg-cyan-300 px-2 py-1 text-[10px] font-black uppercase text-slate-950">
                    live
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {cartridge.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="tag compact">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{formatDate(cartridge.createdAt)}</span>
                <span>{cartridge.estimatedDifficulty}</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onLoad(cartridge)} className="mini-button">
                  Load
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
                <button type="button" onClick={() => onDelete(cartridge.id)} className="mini-button danger">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

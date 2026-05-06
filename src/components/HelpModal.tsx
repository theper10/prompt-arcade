interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-lg border border-cyan-200/25 bg-[#0d1118] p-5 shadow-[0_30px_120px_rgba(0,0,0,.7)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">operator notes</p>
            <h2 className="mt-1 text-2xl font-black text-white">How to use Prompt Arcade</h2>
          </div>
          <button type="button" onClick={onClose} className="tool-button">
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-300">
          <p>
            Describe a tiny game idea, tune the cartridge settings, then generate a playable browser game.
          </p>
          <p>
            After a cartridge boots, click the game frame to focus it. Prompt Arcade uses desktop-first controls: WASD, Arrow keys, Space, and mouse or pointer input. Touch controls only appear when requested.
          </p>
          <p>
            Generated games can be strange sometimes. Repair handles crashes or validation errors. Fix Gameplay repairs unclear or unfair games.
          </p>
          <p>
            Saved cartridges stay in this browser. Export creates a standalone HTML file you can open later.
          </p>
        </div>
      </div>
    </div>
  )
}

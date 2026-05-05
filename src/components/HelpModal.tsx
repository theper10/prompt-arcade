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
            <h2 className="mt-1 text-2xl font-black text-white">How Prompt Arcade works</h2>
          </div>
          <button type="button" onClick={onClose} className="tool-button">
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-300">
          <p>
            Prompt Arcade sends your prompt to a local Node/Express API. The API asks OpenAI to generate a small,
            self-contained HTML/CSS/JavaScript game cartridge.
          </p>
          <p>
            Generated games run only inside a sandboxed iframe. The frontend never receives your OpenAI API key, and
            generated JavaScript is not injected into the React app.
          </p>
          <p>
            AI-made cartridges can still crash or produce awkward game logic. Use Reload, Repair with AI, or generate a
            fresh cartridge when a game misbehaves.
          </p>
          <p>
            Saved cartridges live in this browser through localStorage. Export creates a standalone HTML file you can
            run locally.
          </p>
        </div>
      </div>
    </div>
  )
}

interface HeaderProps {
  onHelp: () => void
}

export function Header({ onHelp }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg border border-cyan-300/45 bg-cyan-300/10 shadow-[0_0_24px_rgba(68,247,228,.2)]">
          <span className="font-mono text-lg font-black text-cyan-100">PA</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Prompt Arcade</h1>
          <p className="text-sm text-slate-300">Type a prompt. Boot a tiny AI-made game.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase text-emerald-100">
          local AI cartridge lab
        </span>
        <button type="button" className="secondary-button" onClick={onHelp}>
          Help
        </button>
      </div>
    </header>
  )
}

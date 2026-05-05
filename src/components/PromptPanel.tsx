import { examplePrompts, randomExamplePrompt } from '../lib/examples'

interface PromptPanelProps {
  prompt: string
  isLoading: boolean
  onPromptChange: (prompt: string) => void
  onGenerate: () => void
}

export function PromptPanel({ prompt, isLoading, onPromptChange, onGenerate }: PromptPanelProps) {
  const trimmedLength = prompt.trim().length
  const canGenerate = trimmedLength > 0 && trimmedLength <= 300 && !isLoading

  return (
    <section className="arcade-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">cartridge request</p>
          <h2 className="text-xl font-black text-white">What should the arcade invent?</h2>
        </div>
        <span className="font-mono text-xs text-slate-400">{prompt.length}/300</span>
      </div>

      <label className="sr-only" htmlFor="prompt-input">
        Game prompt
      </label>
      <textarea
        id="prompt-input"
        value={prompt}
        maxLength={300}
        disabled={isLoading}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="make me a cozy vampire fishing game"
        className="min-h-32 w-full resize-none rounded-lg border border-white/12 bg-black/35 px-4 py-3 text-base text-white shadow-inner outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-200/25 disabled:cursor-wait disabled:opacity-70"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {examplePrompts.slice(0, 5).map((example) => (
          <button
            key={example}
            type="button"
            disabled={isLoading}
            onClick={() => onPromptChange(example)}
            className="chip"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">Generated games run in a sandboxed iframe.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onPromptChange(randomExamplePrompt(prompt))}
            className="secondary-button"
          >
            Surprise Me
          </button>
          <button type="button" disabled={!canGenerate} onClick={onGenerate} className="primary-button">
            {isLoading ? 'Generating...' : 'Generate Game'}
          </button>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CartridgeDetails } from './components/CartridgeDetails'
import { CartridgeRunner } from './components/CartridgeRunner'
import { Header } from './components/Header'
import { HelpModal } from './components/HelpModal'
import { LoadingConsole } from './components/LoadingConsole'
import { PromptPanel } from './components/PromptPanel'
import { SavedGallery } from './components/SavedGallery'
import { SettingsPanel } from './components/SettingsPanel'
import { Toasts, type ToastMessage } from './components/Toasts'
import { generateCartridge, PromptArcadeApiError } from './lib/api'
import { downloadCartridgeHtml } from './lib/download'
import {
  deleteSavedCartridge,
  loadSavedCartridges,
  loadSettings,
  markCartridgePlayed,
  saveSettings,
  upsertSavedCartridge,
} from './lib/storage'
import type { AiCartridge, CartridgeSettings } from './types/cartridge'

const gameplayIssueOptions = [
  'I lose instantly',
  'Shooting is invisible',
  'Sorting does not work',
  'Controls do not match instructions',
  'I cannot win',
  'Objects spawn off-screen',
  'Other',
]

function App() {
  const [prompt, setPrompt] = useState('make me a cozy vampire fishing game')
  const [settings, setSettings] = useState<CartridgeSettings>(() => loadSettings())
  const [currentCartridge, setCurrentCartridge] = useState<AiCartridge | null>(null)
  const [savedCartridges, setSavedCartridges] = useState<AiCartridge[]>(() => loadSavedCartridges())
  const [isLoading, setIsLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [helpOpen, setHelpOpen] = useState(false)
  const [gameplayFixOpen, setGameplayFixOpen] = useState(false)
  const [gameplayIssue, setGameplayIssue] = useState(gameplayIssueOptions[0])
  const [gameplayIssueDetails, setGameplayIssueDetails] = useState('')

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  function showToast(message: string, tone: ToastMessage['tone'] = 'info') {
    const id =
      typeof globalThis.crypto?.randomUUID === 'function' ? globalThis.crypto.randomUUID() : String(Date.now())

    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  async function requestCartridge(
    payload: Parameters<typeof generateCartridge>[0],
    successMessage: string,
    loadingMessage: string,
  ) {
    setIsLoading(true)
    setLoadingLabel(loadingMessage)

    try {
      const cartridge = await generateCartridge(payload)

      setCurrentCartridge(cartridge)
      setPrompt(cartridge.prompt)
      showToast(successMessage, 'success')
      return cartridge
    } catch (error) {
      const message =
        error instanceof PromptArcadeApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'The arcade could not generate a cartridge.'
      showToast(message, 'error')
      return null
    } finally {
      setIsLoading(false)
      setLoadingLabel('')
    }
  }

  async function handleGenerate() {
    const cleanPrompt = prompt.trim()

    if (!cleanPrompt) {
      showToast('Add a prompt before generating a cartridge.', 'error')
      return
    }

    if (cleanPrompt.length > 300) {
      showToast('Prompts must be 300 characters or fewer.', 'error')
      return
    }

    await requestCartridge(
      {
        prompt: cleanPrompt,
        ...settings,
      },
      'Cartridge generated and booted into the slot.',
      'Generating cartridge...',
    )
  }

  async function handleRepair(errorMessage: string) {
    if (!currentCartridge) {
      return
    }

    await requestCartridge(
      {
        prompt: currentCartridge.prompt,
        ...settings,
        repairContext: {
          intent: 'repair',
          previousTitle: currentCartridge.title,
          previousJs: currentCartridge.js,
          errorMessage,
          previousControls: currentCartridge.controls,
          previousObjective: currentCartridge.objective,
        },
      },
      'Repair cartridge generated.',
      'Repairing cartridge...',
    )
  }

  async function handleRegenerateVariant() {
    const sourcePrompt = currentCartridge?.prompt ?? prompt.trim()

    if (!sourcePrompt) {
      showToast('Add or load a prompt before regenerating a variant.', 'error')
      return
    }

    await requestCartridge(
      {
        prompt: sourcePrompt,
        ...settings,
        repairContext: currentCartridge
          ? {
              intent: 'variant',
              previousTitle: currentCartridge.title,
              previousJs: currentCartridge.js,
              previousControls: currentCartridge.controls,
              previousObjective: currentCartridge.objective,
              note: 'Generate a fresh cartridge with different mechanics from the previous one.',
            }
          : {
              intent: 'variant',
              note: 'Generate a fresh variant of this prompt.',
            },
      },
      'Fresh variant generated.',
      'Regenerating variant...',
    )
  }

  async function handleSimplifyGame() {
    if (!currentCartridge) {
      showToast('Generate or load a cartridge before simplifying it.', 'error')
      return
    }

    await requestCartridge(
      {
        prompt: currentCartridge.prompt,
        ...settings,
        repairContext: {
          intent: 'simplify',
          previousTitle: currentCartridge.title,
          previousJs: currentCartridge.js,
          previousControls: currentCartridge.controls,
          previousObjective: currentCartridge.objective,
          note: 'The previous cartridge was too fragile or too complex. Generate a simpler, more reliable version of the same idea.',
        },
      },
      'Simpler cartridge generated.',
      'Simplifying cartridge...',
    )
  }

  async function handleFixGameplaySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentCartridge) {
      showToast('Generate or load a cartridge before fixing gameplay.', 'error')
      setGameplayFixOpen(false)
      return
    }

    const issueText = [gameplayIssue, gameplayIssueDetails.trim()].filter(Boolean).join(': ')

    setGameplayFixOpen(false)

    await requestCartridge(
      {
        prompt: currentCartridge.prompt,
        ...settings,
        repairContext: {
          intent: 'gameplay_fix',
          previousTitle: currentCartridge.title,
          previousJs: currentCartridge.js,
          previousControls: currentCartridge.controls,
          previousObjective: currentCartridge.objective,
          note: issueText || 'The previous cartridge runs but is unclear, unfair, or not meaningfully playable.',
        },
      },
      'Gameplay fix generated.',
      'Fixing gameplay...',
    )

    setGameplayIssue(gameplayIssueOptions[0])
    setGameplayIssueDetails('')
  }

  function handleSaveCurrent() {
    if (!currentCartridge) {
      return
    }

    const next = upsertSavedCartridge(currentCartridge)
    setSavedCartridges(next)
    showToast('Cartridge saved to the local gallery.', 'success')
  }

  function handleDeleteSaved(id: string) {
    const next = deleteSavedCartridge(id)

    setSavedCartridges(next)
    showToast('Saved cartridge deleted.', 'info')
  }

  async function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    const textarea = document.createElement('textarea')

    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }

  async function handleCopySummary() {
    if (!currentCartridge) {
      return
    }

    const summary = `Prompt Arcade generated: ${currentCartridge.title}
Prompt: ${currentCartridge.prompt}
Objective: ${currentCartridge.objective}
Controls: ${currentCartridge.controls.join(', ')}`

    try {
      await copyText(summary)
      showToast('Summary copied.', 'success')
    } catch {
      showToast('Could not copy the summary in this browser.', 'error')
    }
  }

  function handleExportCurrent() {
    if (!currentCartridge) {
      return
    }

    downloadCartridgeHtml(currentCartridge)
    showToast('Standalone HTML cartridge exported.', 'success')
  }

  return (
    <div className="arcade-shell min-h-screen">
      <Header onHelp={() => setHelpOpen(true)} />

      <main className="mx-auto grid w-full max-w-[1500px] gap-4 px-4 pb-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <PromptPanel
            prompt={prompt}
            isLoading={isLoading}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
          />
          <SettingsPanel settings={settings} isLoading={isLoading} onSettingsChange={setSettings} />
        </section>

        <LoadingConsole active={isLoading} />

        <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <CartridgeDetails
            cartridge={currentCartridge}
            onSave={handleSaveCurrent}
            onCopySummary={handleCopySummary}
          />
          <CartridgeRunner
            key={currentCartridge?.id ?? 'empty-runner'}
            cartridge={currentCartridge}
            isLoading={isLoading}
            onRepair={handleRepair}
            onRegenerate={handleRegenerateVariant}
            onSimplify={handleSimplifyGame}
            onFixGameplay={() => {
              if (!currentCartridge) {
                showToast('Generate or load a cartridge before fixing gameplay.', 'error')
                return
              }

              setGameplayFixOpen(true)
            }}
            onExport={handleExportCurrent}
          />
          <SavedGallery
            savedCartridges={savedCartridges}
            activeId={currentCartridge?.id}
            onLoad={(cartridge) => {
              const played = {
                ...cartridge,
                lastPlayedAt: new Date().toISOString(),
              }

              setCurrentCartridge(played)
              setPrompt(cartridge.prompt)
              setSavedCartridges(markCartridgePlayed(cartridge.id))
              showToast('Saved cartridge loaded.', 'info')
            }}
            onClonePrompt={(nextPrompt) => {
              setPrompt(nextPrompt)
              showToast('Prompt cloned into the generator.', 'info')
            }}
            onDelete={handleDeleteSaved}
            onToast={showToast}
          />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1500px] px-4 pb-8 text-sm text-slate-500 sm:px-6 lg:px-8">
        <div className="border-t border-white/10 pt-5">
          Turn weird ideas into tiny playable browser games.
        </div>
      </footer>

      {gameplayFixOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form
            onSubmit={handleFixGameplaySubmit}
            className="w-full max-w-lg rounded-lg border border-cyan-200/25 bg-[#0d1118] p-5 shadow-[0_30px_120px_rgba(0,0,0,.7)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">playability repair</p>
                <h2 className="mt-1 text-xl font-black text-white">Fix Gameplay</h2>
              </div>
              <button type="button" onClick={() => setGameplayFixOpen(false)} className="tool-button">
                Close
              </button>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-200" htmlFor="gameplay-issue">
              What feels wrong?
            </label>
            <select
              id="gameplay-issue"
              value={gameplayIssue}
              onChange={(event) => setGameplayIssue(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-200/70"
            >
              {gameplayIssueOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>

            <label className="mt-4 block text-sm font-bold text-slate-200" htmlFor="gameplay-issue-details">
              Details
            </label>
            <textarea
              id="gameplay-issue-details"
              value={gameplayIssueDetails}
              onChange={(event) => setGameplayIssueDetails(event.target.value.slice(0, 600))}
              rows={3}
              placeholder="Optional: what happened when you tried to play?"
              className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-200/70"
            />

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setGameplayFixOpen(false)} className="secondary-button">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="primary-button">
                Fix Gameplay
              </button>
            </div>
          </form>
        </div>
      )}

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
      {loadingLabel && <span className="sr-only" aria-live="polite">{loadingLabel}</span>}
    </div>
  )
}

export default App

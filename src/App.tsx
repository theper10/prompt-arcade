import { useEffect, useState } from 'react'
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

function App() {
  const [prompt, setPrompt] = useState('make me a cozy vampire fishing game')
  const [settings, setSettings] = useState<CartridgeSettings>(() => loadSettings())
  const [currentCartridge, setCurrentCartridge] = useState<AiCartridge | null>(null)
  const [savedCartridges, setSavedCartridges] = useState<AiCartridge[]>(() => loadSavedCartridges())
  const [isLoading, setIsLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [helpOpen, setHelpOpen] = useState(false)

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

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
      {loadingLabel && <span className="sr-only" aria-live="polite">{loadingLabel}</span>}
    </div>
  )
}

export default App

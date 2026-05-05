import { useEffect, useMemo, useRef, useState } from 'react'
import { buildCartridgeDocument } from '../lib/buildCartridgeDocument'
import type { AiCartridge } from '../types/cartridge'

type BootState = 'idle' | 'ready' | 'timeout' | 'error'

interface CartridgeRunnerProps {
  cartridge: AiCartridge | null
  isLoading: boolean
  onRepair: (errorMessage: string) => void
  onExport: () => void
}

interface CartridgeMessage {
  type?: string
  message?: string
  line?: number
  column?: number
}

export function CartridgeRunner({ cartridge, isLoading, onRepair, onExport }: CartridgeRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [bootState, setBootState] = useState<BootState>('idle')
  const [runtimeError, setRuntimeError] = useState('')
  const [iframeKey, setIframeKey] = useState(0)

  const srcDoc = useMemo(() => (cartridge ? buildCartridgeDocument(cartridge) : ''), [cartridge])

  useEffect(() => {
    if (!cartridge) {
      return
    }

    const timeout = window.setTimeout(() => {
      setBootState((state) => (state === 'idle' ? 'timeout' : state))
    }, 8000)

    function handleMessage(event: MessageEvent<CartridgeMessage>) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return
      }

      if (event.data?.type === 'VIBE_CARTRIDGE_READY') {
        setBootState('ready')
      }

      if (event.data?.type === 'VIBE_CARTRIDGE_ERROR') {
        const location =
          typeof event.data.line === 'number' ? ` at line ${event.data.line}:${event.data.column ?? 0}` : ''
        setRuntimeError(`${event.data.message ?? 'Unknown cartridge error'}${location}`)
        setBootState('error')
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('message', handleMessage)
    }
  }, [cartridge, iframeKey])

  const overlayMessage =
    bootState === 'timeout'
      ? 'The cartridge did not report ready within 8 seconds.'
      : bootState === 'error'
        ? runtimeError
        : ''

  function reload() {
    setBootState('idle')
    setRuntimeError('')
    setIframeKey((key) => key + 1)
  }

  function focusGame() {
    iframeRef.current?.focus()
  }

  return (
    <section className="arcade-panel flex min-h-[520px] flex-col overflow-hidden p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">sandbox runner</p>
          <h2 className="text-xl font-black text-white">{cartridge ? cartridge.title : 'Awaiting cartridge'}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!cartridge || isLoading} onClick={reload} className="tool-button">
            Reload
          </button>
          <button
            type="button"
            disabled={!cartridge || isLoading}
            onClick={() => onRepair(runtimeError || 'The cartridge failed to boot reliably.')}
            className="tool-button"
          >
            Repair
          </button>
          <button type="button" disabled={!cartridge} onClick={onExport} className="tool-button">
            Export HTML
          </button>
          <button type="button" disabled={!cartridge} onClick={focusGame} className="tool-button">
            Focus
          </button>
        </div>
      </div>

      <div className="relative min-h-[420px] flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/45">
        {cartridge ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            title={`${cartridge.title} game cartridge`}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="h-full min-h-[420px] w-full bg-black"
          />
        ) : (
          <div className="grid h-full min-h-[420px] place-items-center px-6 text-center">
            <div>
              <p className="font-mono text-sm uppercase text-cyan-200">slot empty</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                Generate a game to boot a self-contained HTML cartridge inside this sandbox.
              </p>
            </div>
          </div>
        )}

        {cartridge && bootState === 'idle' && (
          <div className="pointer-events-none absolute inset-x-4 top-4 rounded-lg border border-cyan-300/30 bg-black/70 px-4 py-3 text-sm text-cyan-100 backdrop-blur">
            Booting sandbox...
          </div>
        )}

        {overlayMessage && (
          <div className="absolute inset-0 grid place-items-center bg-black/78 p-6 backdrop-blur-sm">
            <div className="max-w-lg rounded-lg border border-rose-300/45 bg-rose-950/70 p-5 text-center shadow-2xl">
              <p className="font-mono text-xs uppercase text-rose-200">cartridge crash</p>
              <h3 className="mt-2 text-xl font-black text-white">The game hit a runtime snag.</h3>
              <p className="mt-3 text-sm leading-6 text-rose-100">{overlayMessage}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button type="button" onClick={reload} className="secondary-button">
                  Reload
                </button>
                <button type="button" disabled={isLoading} onClick={() => onRepair(overlayMessage)} className="primary-button">
                  Repair with AI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

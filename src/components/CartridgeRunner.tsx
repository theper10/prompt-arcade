import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildCartridgeDocument } from '../lib/buildCartridgeDocument'
import { cn } from '../lib/cn'
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

const gameplayKeys = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w',
  'a',
  's',
  'd',
])

function isGameplayKey(event: KeyboardEvent) {
  return gameplayKeys.has(event.key) || gameplayKeys.has(event.key.toLowerCase()) || event.key === ' ' || event.code === 'Space'
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()

  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}

export function CartridgeRunner({ cartridge, isLoading, onRepair, onExport }: CartridgeRunnerProps) {
  const runnerRef = useRef<HTMLElement | null>(null)
  const gameFrameRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [bootState, setBootState] = useState<BootState>('idle')
  const [runtimeError, setRuntimeError] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const [gameActive, setGameActive] = useState(false)

  const srcDoc = useMemo(() => (cartridge ? buildCartridgeDocument(cartridge) : ''), [cartridge])

  const releaseGameFocus = useCallback(() => {
    setGameActive(false)
    iframeRef.current?.blur()

    try {
      runnerRef.current?.focus({ preventScroll: true })
    } catch {
      runnerRef.current?.focus()
    }
  }, [])

  const focusGame = useCallback(() => {
    if (!cartridge) {
      return
    }

    setGameActive(true)

    try {
      iframeRef.current?.focus({ preventScroll: true })
    } catch {
      iframeRef.current?.focus()
    }

    try {
      iframeRef.current?.contentWindow?.focus()
    } catch {
      // Cross-origin focus access can be unavailable for sandboxed srcDoc in some browsers.
    }
  }, [cartridge])

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

      if (event.data?.type === 'GAME_FOCUSED') {
        setGameActive(true)
      }

      if (event.data?.type === 'GAME_BLURRED') {
        releaseGameFocus()
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('message', handleMessage)
    }
  }, [cartridge, iframeKey, releaseGameFocus])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!gameActive || isEditableTarget(event.target)) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        releaseGameFocus()
        return
      }

      if (isGameplayKey(event)) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [gameActive, releaseGameFocus])

  useEffect(() => {
    if (!gameActive) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (target instanceof Node && gameFrameRef.current?.contains(target)) {
        return
      }

      releaseGameFocus()
    }

    document.addEventListener('pointerdown', handlePointerDown, { capture: true })

    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
  }, [gameActive, releaseGameFocus])

  const overlayMessage =
    bootState === 'timeout'
      ? 'The cartridge did not report ready within 8 seconds.'
      : bootState === 'error'
        ? runtimeError
        : ''

  function reload() {
    setBootState('idle')
    setRuntimeError('')
    setGameActive(false)
    setIframeKey((key) => key + 1)
  }

  return (
    <section ref={runnerRef} tabIndex={-1} className="arcade-panel flex min-h-[520px] flex-col overflow-hidden p-3 outline-none sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">sandbox runner</p>
          <h2 className="text-xl font-black text-white">{cartridge ? cartridge.title : 'Awaiting cartridge'}</h2>
          <p className="mt-2 text-sm text-slate-400">Click the game first, then use WASD / arrows / space.</p>
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
            Focus Game
          </button>
        </div>
      </div>

      <div
        ref={gameFrameRef}
        data-testid="game-frame"
        onPointerDownCapture={focusGame}
        className={cn(
          'relative min-h-[420px] flex-1 overflow-hidden rounded-lg border bg-black/45 transition',
          gameActive
            ? 'border-cyan-200/80 ring-2 ring-cyan-200/55 shadow-[0_0_34px_rgba(93,246,255,.22)]'
            : 'border-white/10',
        )}
      >
        {cartridge ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            title={`${cartridge.title} game cartridge`}
            tabIndex={0}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            onFocus={() => setGameActive(true)}
            onBlur={() => setGameActive(false)}
            className="h-full min-h-[420px] w-full bg-black outline-none"
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

        {cartridge && (
          <div
            aria-live="polite"
            className={cn(
              'pointer-events-none absolute left-4 top-4 rounded-full border px-3 py-1.5 font-mono text-xs font-bold uppercase backdrop-blur',
              gameActive
                ? 'border-emerald-200/55 bg-emerald-300/15 text-emerald-100'
                : 'border-cyan-200/35 bg-black/70 text-cyan-100',
            )}
          >
            {gameActive ? 'Game focused · Press Esc to release keyboard' : 'Click game to focus'}
          </div>
        )}

        {cartridge && bootState === 'idle' && (
          <div className="pointer-events-none absolute inset-x-4 top-14 rounded-lg border border-cyan-300/30 bg-black/70 px-4 py-3 text-sm text-cyan-100 backdrop-blur">
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

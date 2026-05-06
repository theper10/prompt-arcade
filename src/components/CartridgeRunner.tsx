import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { buildCartridgeDocument } from '../lib/buildCartridgeDocument'
import { cn } from '../lib/cn'
import type { AiCartridge } from '../types/cartridge'

type BootState = 'idle' | 'ready' | 'timeout' | 'error'

interface CartridgeRunnerProps {
  cartridge: AiCartridge | null
  isLoading: boolean
  onRepair: (errorMessage: string) => void
  onRegenerate: () => void
  onSimplify: () => void
  onFixGameplay: () => void
  onExport: () => void
}

interface CartridgeMessage {
  type?: string
  message?: string
  line?: number
  column?: number
}

const gameplayKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'])

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

function statusFor(bootState: BootState, gameActive: boolean) {
  if (bootState === 'error' || bootState === 'timeout') {
    return 'Crashed'
  }

  if (bootState === 'idle') {
    return 'Booting'
  }

  return gameActive ? 'Game focused' : 'Not focused'
}

export function CartridgeRunner({
  cartridge,
  isLoading,
  onRepair,
  onRegenerate,
  onSimplify,
  onFixGameplay,
  onExport,
}: CartridgeRunnerProps) {
  const runnerRef = useRef<HTMLElement | null>(null)
  const mainFrameRef = useRef<HTMLDivElement | null>(null)
  const mainIframeRef = useRef<HTMLIFrameElement | null>(null)
  const [bootState, setBootState] = useState<BootState>('idle')
  const [runtimeError, setRuntimeError] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const [gameActive, setGameActive] = useState(false)

  const srcDoc = useMemo(() => (cartridge ? buildCartridgeDocument(cartridge) : ''), [cartridge])
  const activeStatus = statusFor(bootState, gameActive)
  const crashMessage =
    bootState === 'timeout'
      ? 'The cartridge did not report ready within 8 seconds.'
      : bootState === 'error'
        ? runtimeError
        : ''

  const releaseGameFocus = useCallback(() => {
    setGameActive(false)
    mainIframeRef.current?.blur()

    try {
      runnerRef.current?.focus({ preventScroll: true })
    } catch {
      runnerRef.current?.focus()
    }
  }, [])

  const focusGame = useCallback((iframe?: HTMLIFrameElement | null) => {
    if (!cartridge) {
      return
    }

    const targetIframe = iframe ?? mainIframeRef.current

    setGameActive(true)

    try {
      targetIframe?.focus({ preventScroll: true })
    } catch {
      targetIframe?.focus()
    }

    try {
      targetIframe?.contentWindow?.focus()
    } catch {
      // Sandboxed srcDoc focus access can be unavailable in some browsers.
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
      if (event.source !== mainIframeRef.current?.contentWindow) {
        return
      }

      if (event.data?.type === 'VIBE_CARTRIDGE_READY') {
        setBootState((state) => (state === 'error' ? state : 'ready'))
      }

      if (event.data?.type === 'VIBE_CARTRIDGE_ERROR') {
        const location =
          typeof event.data.line === 'number' ? ` at line ${event.data.line}:${event.data.column ?? 0}` : ''
        setRuntimeError(`${event.data.message ?? 'Unknown cartridge error'}${location}`)
        setBootState('error')
        setGameActive(false)
      }

      if (event.data?.type === 'GAME_FOCUSED') {
        setGameActive(true)
      }

      if (event.data?.type === 'GAME_RELEASED') {
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
      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key === 'Escape') {
        if (gameActive) {
          event.preventDefault()
          releaseGameFocus()
        }

        return
      }

      if (gameActive && isGameplayKey(event)) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [gameActive, releaseGameFocus])

  useEffect(() => {
    function syncIframeFocus() {
      const activeElement = document.activeElement

      if (activeElement === mainIframeRef.current) {
        setGameActive(true)
      }
    }

    window.addEventListener('blur', syncIframeFocus)
    document.addEventListener('focusin', syncIframeFocus)
    document.addEventListener('pointerup', syncIframeFocus, { capture: true })

    return () => {
      window.removeEventListener('blur', syncIframeFocus)
      document.removeEventListener('focusin', syncIframeFocus)
      document.removeEventListener('pointerup', syncIframeFocus, { capture: true })
    }
  }, [])

  useEffect(() => {
    if (!gameActive) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      const insideMain = target instanceof Node && mainFrameRef.current?.contains(target)

      if (insideMain) {
        return
      }

      releaseGameFocus()
    }

    document.addEventListener('pointerdown', handlePointerDown, { capture: true })

    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
  }, [gameActive, releaseGameFocus])

  function reload() {
    setBootState('idle')
    setRuntimeError('')
    setGameActive(false)
    setIframeKey((key) => key + 1)
  }

  function renderToolbar(iframeRef: RefObject<HTMLIFrameElement | null>) {
    return (
      <div className="mb-3 rounded-lg border border-white/10 bg-black/24 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 font-mono text-xs font-bold uppercase',
                  activeStatus === 'Game focused' && 'border-emerald-200/55 bg-emerald-300/15 text-emerald-100',
                  activeStatus === 'Not focused' && 'border-slate-300/25 bg-white/[.05] text-slate-200',
                  activeStatus === 'Booting' && 'border-cyan-200/40 bg-cyan-300/10 text-cyan-100',
                  activeStatus === 'Crashed' && 'border-rose-200/55 bg-rose-400/12 text-rose-100',
                )}
              >
                {activeStatus}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {gameActive
                ? 'Keyboard captured. Press Esc to release.'
                : 'Click the game or press Focus to capture WASD / arrows / space.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!cartridge} onClick={() => focusGame(iframeRef.current)} className="tool-button">
              Focus
            </button>
            <button type="button" disabled={!cartridge || isLoading} onClick={reload} className="tool-button">
              Reload
            </button>
            <button
              type="button"
              disabled={!cartridge || isLoading}
              onClick={() => onRepair(crashMessage || 'The cartridge needs a safer repair pass.')}
              className="tool-button"
            >
              Repair
            </button>
            <button type="button" disabled={!cartridge || isLoading} onClick={onRegenerate} className="tool-button">
              Regenerate Variant
            </button>
            <button type="button" disabled={!cartridge || isLoading} onClick={onSimplify} className="tool-button">
              Simplify Game
            </button>
            <button type="button" disabled={!cartridge || isLoading} onClick={onFixGameplay} className="tool-button">
              Fix Gameplay
            </button>
            <button type="button" disabled={!cartridge} onClick={onExport} className="tool-button">
              Export HTML
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderCrashPanel() {
    if (!crashMessage || !cartridge) {
      return null
    }

    return (
      <div className="mb-3 rounded-lg border border-rose-300/35 bg-rose-950/45 p-4">
        <p className="font-mono text-xs uppercase text-rose-200">This cartridge crashed.</p>
        <p className="mt-2 text-sm leading-6 text-rose-100">{crashMessage}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={isLoading} onClick={() => onRepair(crashMessage)} className="primary-button">
            Repair with AI
          </button>
          <button type="button" disabled={isLoading} onClick={onRegenerate} className="secondary-button">
            Regenerate
          </button>
          <button type="button" onClick={reload} className="secondary-button">
            Reload anyway
          </button>
        </div>
      </div>
    )
  }

  function renderViewport(frameRef: RefObject<HTMLDivElement | null>, iframeRef: RefObject<HTMLIFrameElement | null>) {
    return (
      <div
        ref={frameRef}
        data-testid="game-frame"
        onPointerDownCapture={() => focusGame(iframeRef.current)}
        className={cn(
          'relative flex-1 overflow-hidden rounded-lg border bg-black/45 transition',
          'min-h-[420px]',
          gameActive
            ? 'border-cyan-200/80 ring-2 ring-cyan-200/55 shadow-[0_0_34px_rgba(93,246,255,.22)]'
            : 'border-white/10',
        )}
      >
        {cartridge ? (
          <iframe
            key={`main-${iframeKey}`}
            ref={iframeRef}
            title={`${cartridge.title} game cartridge`}
            tabIndex={0}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            onFocus={() => setGameActive(true)}
            className="h-full w-full bg-black outline-none"
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
      </div>
    )
  }

  return (
    <section
      ref={runnerRef}
      tabIndex={-1}
      className="arcade-panel flex min-h-[520px] flex-col overflow-hidden p-3 outline-none sm:p-4"
    >
      <div className="mb-3">
        <p className="eyebrow">sandbox runner</p>
        <h2 className="mt-1 text-xl font-black text-white">{cartridge ? cartridge.title : 'Awaiting cartridge'}</h2>
      </div>

      {renderToolbar(mainIframeRef)}
      {renderCrashPanel()}
      {renderViewport(mainFrameRef, mainIframeRef)}
    </section>
  )
}

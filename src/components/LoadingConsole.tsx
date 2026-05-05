import { useEffect, useState } from 'react'

const messages = [
  'warming up the cartridge slot...',
  'asking the tiny game gremlins...',
  'compiling vibes into rectangles...',
  'checking for cursed JavaScript...',
  'booting sandbox...',
]

interface LoadingConsoleProps {
  active: boolean
}

export function LoadingConsole({ active }: LoadingConsoleProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }

    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length)
    }, 1300)

    return () => window.clearInterval(timer)
  }, [active])

  if (!active) {
    return null
  }

  return (
    <section className="arcade-panel overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <p className="font-mono text-xs uppercase text-cyan-200">generation console</p>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(125,255,130,.8)]" />
      </div>
      <div className="mt-4 min-h-24 font-mono text-sm text-emerald-100">
        {messages.map((message, index) => (
          <p key={message} className={index <= messageIndex ? 'opacity-100' : 'opacity-20'}>
            <span className="text-cyan-200">&gt;</span> {index <= messageIndex ? message : 'waiting...'}
          </p>
        ))}
      </div>
    </section>
  )
}

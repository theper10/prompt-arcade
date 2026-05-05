import { cn } from '../lib/cn'

export interface ToastMessage {
  id: string
  message: string
  tone: 'success' | 'error' | 'info'
}

interface ToastsProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function Toasts({ toasts, onDismiss }: ToastsProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={cn(
            'rounded-lg border px-4 py-3 text-left text-sm shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-md transition hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-cyan-200',
            toast.tone === 'success' && 'border-emerald-300/40 bg-emerald-400/[.15] text-emerald-50',
            toast.tone === 'error' && 'border-rose-300/45 bg-rose-500/[.16] text-rose-50',
            toast.tone === 'info' && 'border-cyan-300/40 bg-cyan-400/[.14] text-cyan-50',
          )}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}

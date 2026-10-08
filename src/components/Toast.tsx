import { create } from 'zustand'

type ToastKind = 'info' | 'error' | 'success'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastState {
  items: ToastItem[]
  push: (kind: ToastKind, message: string) => void
  remove: (id: number) => void
}

let seq = 0
const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (kind, message) => {
    const id = ++seq
    set((s) => ({ items: [...s.items, { id, kind, message }] }))
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }))
    }, 3600)
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

export const toast = {
  info: (m: string) => useToastStore.getState().push('info', m),
  error: (m: string) => useToastStore.getState().push('error', m),
  success: (m: string) => useToastStore.getState().push('success', m),
}

const STYLES: Record<ToastKind, string> = {
  info: 'bg-white text-edu-ink border-edu-soft',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  error: 'bg-rose-50 text-rose-800 border-rose-200',
}

export function Toaster() {
  const items = useToastStore((s) => s.items)
  const remove = useToastStore((s) => s.remove)
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => remove(t.id)}
          className={`min-w-[220px] max-w-sm rounded-card border px-4 py-3 text-left text-sm shadow-card ${STYLES[t.kind]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}

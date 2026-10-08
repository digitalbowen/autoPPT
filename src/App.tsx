import { useEffect } from 'react'
import { useCourseStore } from './store/courseStore'
import type { StepKey } from './types'
import { StepUpload } from './components/StepUpload'
import { StepPreview } from './components/StepPreview'
import { StepGenerate } from './components/StepGenerate'
import { StepClassroom } from './components/StepClassroom'
import { Toaster, toast } from './components/Toast'

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'upload', label: '上传' },
  { key: 'preview', label: '勾选' },
  { key: 'generate', label: '生成' },
  { key: 'classroom', label: '课堂' },
]

export default function App() {
  const step = useCourseStore((s) => s.step)
  const setStep = useCourseStore((s) => s.setStep)
  const chunks = useCourseStore((s) => s.chunks)
  const loadLast = useCourseStore((s) => s.loadLast)

  useEffect(() => {
    void loadLast().then((ok) => {
      if (ok) toast.info('已恢复上次课程')
    })
  }, [loadLast])

  const activeIndex = STEPS.findIndex((s) => s.key === step)
  const canNavigate = (i: number) => i === 0 || chunks.length > 0

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-edu-soft/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-edu-accent text-lg font-bold text-white">
              E
            </span>
            <div>
              <div className="text-base font-semibold text-edu-ink">EduGen</div>
              <div className="text-xs text-slate-500">资料驱动 · 出PPT · 出互动题</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const active = i === activeIndex
              const done = i < activeIndex
              return (
                <button
                  key={s.key}
                  disabled={!canNavigate(i)}
                  onClick={() => setStep(s.key)}
                  className={[
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition',
                    active
                      ? 'bg-edu-accent text-white shadow-soft'
                      : done
                        ? 'text-edu-accentDark hover:bg-edu-blue'
                        : 'text-slate-400',
                    canNavigate(i) ? 'cursor-pointer' : 'cursor-not-allowed',
                  ].join(' ')}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-xs ${
                      active ? 'bg-white/25' : 'bg-edu-soft text-edu-accentDark'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {step === 'upload' && <StepUpload />}
        {step === 'preview' && <StepPreview />}
        {step === 'generate' && <StepGenerate />}
        {step === 'classroom' && <StepClassroom />}
      </main>

      <Toaster />
    </div>
  )
}

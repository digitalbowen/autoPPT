import { useMemo, useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { QuizItem } from './QuizItem'
import { toast } from './Toast'
import type { Chunk } from '../types'

export function StepClassroom() {
  const quizzes = useCourseStore((s) => s.quizzes)
  const chunks = useCourseStore((s) => s.chunks)
  const answers = useCourseStore((s) => s.answers)
  const addAnswer = useCourseStore((s) => s.addAnswer)
  const resetAnswers = useCourseStore((s) => s.resetAnswers)
  const setStep = useCourseStore((s) => s.setStep)
  const [retryKey, setRetryKey] = useState(0)

  const chunkMap = useMemo(() => {
    const m = new Map<string, Chunk>()
    chunks.forEach((c) => m.set(c.id, c))
    return m
  }, [chunks])

  const sourcesFor = (ids: string[]): Chunk[] =>
    ids.map((id) => chunkMap.get(id)).filter((c): c is Chunk => Boolean(c))

  const answered = answers.length
  const correctCount = answers.filter((a) => a.correct).length
  const accuracy = answered ? Math.round((correctCount / answered) * 100) : 0
  const totalMs = answers.reduce((sum, a) => sum + a.timeMs, 0)

  const wrong = useMemo(() => {
    const wrongIds = new Set(answers.filter((a) => !a.correct).map((a) => a.quizId))
    return quizzes.filter((q) => wrongIds.has(q.id))
  }, [answers, quizzes])

  if (quizzes.length === 0) {
    return (
      <div className="rounded-card border border-edu-soft bg-white p-10 text-center shadow-card">
        <p className="text-slate-500">还没有练习题，先去生成吧。</p>
        <button
          onClick={() => setStep('generate')}
          className="mt-4 rounded-full bg-edu-accent px-5 py-2 text-sm text-white"
        >
          去生成练习题
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="已答" value={`${answered}/${quizzes.length}`} />
        <Stat label="正确率" value={`${accuracy}%`} />
        <Stat label="错题" value={`${wrong.length}`} />
        <Stat label="总耗时" value={`${Math.round(totalMs / 1000)}s`} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-edu-ink">课堂自测</h3>
        <button
          onClick={() => {
            resetAnswers()
            setRetryKey((k) => k + 1)
            toast.info('已重置作答')
          }}
          className="rounded-full border border-edu-soft px-3 py-1.5 text-sm text-edu-accentDark hover:bg-edu-blue"
        >
          重做全部
        </button>
      </div>

      <div className="space-y-3" key={retryKey}>
        {quizzes.map((q, i) => (
          <QuizItem
            key={`${q.id}-${retryKey}`}
            quiz={q}
            index={i}
            sources={sourcesFor(q.sourceChunkIds ?? [])}
            onAnswered={addAnswer}
          />
        ))}
      </div>

      {wrong.length > 0 && (
        <section className="rounded-card border border-rose-200 bg-rose-50/50 p-5">
          <h3 className="mb-3 text-base font-semibold text-rose-800">
            错题本（{wrong.length}）
          </h3>
          <div className="space-y-3">
            {wrong.map((q) => {
              const src = sourcesFor(q.sourceChunkIds ?? [])[0]
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-rose-200 bg-white p-4 text-sm"
                >
                  <p className="font-medium text-edu-ink">{q.question}</p>
                  <p className="mt-1 text-emerald-700">正确答案：{q.answer}</p>
                  {src && (
                    <p className="mt-2 rounded-lg bg-edu-cream p-2 text-xs text-slate-500">
                      原文（{src.id}）：{src.text.slice(0, 120)}…
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <button
            onClick={() => {
              resetAnswers()
              setRetryKey((k) => k + 1)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="mt-4 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            再练一次
          </button>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-edu-soft bg-white p-4 text-center shadow-soft">
      <div className="text-2xl font-bold text-edu-accentDark">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  )
}

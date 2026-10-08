import { useEffect, useState } from 'react'
import type { Chunk, Quiz } from '../types'
import { useCourseStore } from '../store/courseStore'
import { TutorChat } from './TutorChat'
import { Toaster } from './Toast'
import { Skeleton } from './Skeleton'

/** Standalone page opened in a new tab: shows one quiz + its Socratic AI chat. */
export function TutorPage({ quizId, model }: { quizId: string; model: string }) {
  const loadLast = useCourseStore((s) => s.loadLast)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [sources, setSources] = useState<Chunk[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void loadLast().then(() => {
      const st = useCourseStore.getState()
      const q = st.quizzes.find((x) => x.id === quizId) ?? null
      setQuiz(q)
      if (q) {
        const map = new Map(st.chunks.map((c) => [c.id, c]))
        setSources(
          (q.sourceChunkIds ?? [])
            .map((id) => map.get(id))
            .filter((c): c is Chunk => Boolean(c)),
        )
      }
      setLoaded(true)
    })
  }, [loadLast, quizId])

  return (
    <div className="min-h-full">
      <header className="border-b border-edu-soft/70 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-edu-accent text-white">
            💬
          </span>
          <div className="text-sm font-semibold text-edu-ink">
            AI 辅导 · 引导你自己想出答案
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        {!loaded ? (
          <Skeleton lines={4} />
        ) : !quiz ? (
          <div className="rounded-card border border-edu-soft bg-white p-8 text-center text-slate-500 shadow-card">
            没找到这道题，请回到课堂页面重试。
          </div>
        ) : (
          <>
            <section className="rounded-card border border-edu-soft bg-white p-5 shadow-card">
              <div className="mb-1 text-xs text-slate-400">
                {quiz.type} · 来源 {quiz.sourceChunkIds?.join(', ') || '—'}
              </div>
              <p className="font-medium text-edu-ink">{quiz.question}</p>
              {quiz.options && quiz.options.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {quiz.options.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-card border border-edu-soft bg-edu-blue/30 p-5 shadow-card">
              <div className="h-[55vh]">
                <TutorChat quiz={quiz} sources={sources} model={model} />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                AI 不会直接给答案，会一步步引导你思考
              </p>
            </section>
          </>
        )}
      </main>
      <Toaster />
    </div>
  )
}

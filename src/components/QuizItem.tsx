import { useRef, useState } from 'react'
import type { AnswerRecord, Quiz } from '../types'
import { gradeEssay } from '../lib/api'
import { toast } from './Toast'

interface QuizItemProps {
  quiz: Quiz
  index: number
  model?: string
  onAnswered: (record: AnswerRecord) => void
}

function normalize(s: string): string {
  return s.replace(/\s+/g, '').trim().toLowerCase()
}

export function QuizItem({ quiz, index, model, onAnswered }: QuizItemProps) {
  const start = useRef(Date.now())
  const [picked, setPicked] = useState<string | null>(null)
  const [blank, setBlank] = useState('')
  const [essay, setEssay] = useState('')
  const [done, setDone] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [stars, setStars] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [grading, setGrading] = useState(false)

  // Open the Socratic tutor chat in a new browser tab for this quiz.
  const openTutor = () => {
    const url = `${window.location.origin}${window.location.pathname}?tutor=${encodeURIComponent(
      quiz.id,
    )}&model=${encodeURIComponent(model ?? 'qwen-plus')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const finish = (isCorrect: boolean, extra?: Partial<AnswerRecord>) => {
    setDone(true)
    setCorrect(isCorrect)
    onAnswered({
      quizId: quiz.id,
      userAnswer: extra?.userAnswer ?? '',
      correct: isCorrect,
      timeMs: Date.now() - start.current,
      at: Date.now(),
      ...extra,
    })
  }

  const pickChoice = (opt: string) => {
    if (done) return
    setPicked(opt)
    const letter = opt.slice(0, 1)
    const ok = normalize(opt) === normalize(quiz.answer) || letter === quiz.answer.trim()
    finish(ok, { userAnswer: opt })
  }

  const submitBlank = () => {
    if (done) return
    finish(normalize(blank) === normalize(quiz.answer), { userAnswer: blank })
  }

  const submitEssay = async () => {
    if (done || grading) return
    setGrading(true)
    try {
      const res = await gradeEssay(
        { question: quiz.question, referenceAnswer: quiz.answer, userAnswer: essay },
        model,
      )
      setStars(res.stars)
      setFeedback(res.feedback)
      finish(res.correct, {
        userAnswer: essay,
        stars: res.stars,
        feedback: res.feedback,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '批改失败')
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className="rounded-card border border-edu-soft bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-start gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-edu-accent text-xs font-bold text-white">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="mb-1 text-xs text-slate-400">
            {quiz.type} · 来源 {quiz.sourceChunkIds?.join(', ') || '—'}
          </div>
          <p className="font-medium text-edu-ink">{quiz.question}</p>
        </div>
      </div>

      {quiz.type === 'choice' && (
        <div className="space-y-2">
          {(quiz.options ?? []).map((opt) => {
            const isPicked = picked === opt
            const isAnswer =
              done && (normalize(opt) === normalize(quiz.answer) || opt.startsWith(quiz.answer.trim()))
            return (
              <button
                key={opt}
                disabled={done}
                onClick={() => pickChoice(opt)}
                className={`block w-full rounded-xl border px-4 py-2 text-left text-sm transition ${
                  isAnswer
                    ? 'border-emerald-300 bg-emerald-50'
                    : isPicked
                      ? 'border-rose-300 bg-rose-50'
                      : 'border-edu-soft hover:bg-edu-blue/40'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {quiz.type === 'blank' && (
        <div className="flex gap-2">
          <input
            value={blank}
            disabled={done}
            onChange={(e) => setBlank(e.target.value)}
            placeholder="输入答案"
            className="flex-1 rounded-full border border-edu-soft px-4 py-2 text-sm outline-none focus:border-edu-accent"
          />
          <button
            onClick={submitBlank}
            disabled={done}
            className="rounded-full bg-edu-accent px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            提交
          </button>
        </div>
      )}

      {quiz.type === 'essay' && (
        <div className="space-y-2">
          <textarea
            value={essay}
            disabled={done}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="作答…"
            className="h-24 w-full resize-none rounded-xl border border-edu-soft p-3 text-sm outline-none focus:border-edu-accent"
          />
          <button
            onClick={submitEssay}
            disabled={done || grading}
            className="rounded-full bg-edu-accent px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {grading ? '批改中…' : '提交批改'}
          </button>
        </div>
      )}

      <div className="mt-3">
        <button
          onClick={openTutor}
          className="flex items-center gap-1.5 rounded-full border border-edu-soft px-3 py-1.5 text-xs text-edu-accentDark transition hover:bg-edu-blue"
        >
          💬 AI 对话提示
        </button>
      </div>

      {done && (
        <div className="mt-3 rounded-xl bg-edu-cream p-3 text-sm">
          {quiz.type === 'essay' ? (
            <div>
              <div className="font-medium text-edu-accentDark">
                {'★'.repeat(stars ?? 0)}
                {'☆'.repeat(5 - (stars ?? 0))}
              </div>
              <p className="mt-1 text-slate-600">{feedback}</p>
            </div>
          ) : (
            <div
              className={correct ? 'text-emerald-700' : 'text-rose-700'}
            >
              {correct ? '✓ 正确' : `✗ 正确答案：${quiz.answer}`}
            </div>
          )}
          <p className="mt-2 text-slate-500">解析：{quiz.explain}</p>
        </div>
      )}
    </div>
  )
}

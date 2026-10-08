import { useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { generatePpt, generateQuiz } from '../lib/api'
import { exportPptx } from '../lib/exportPptx'
import { PptView } from './PptView'
import { CardSkeleton } from './Skeleton'
import { toast } from './Toast'
import type { Audience, PptStyle, QuestionType } from '../types'

const MODELS = ['qwen-plus', 'qwen-max', 'qwen-turbo']
const ALL_TYPES: { key: QuestionType; label: string }[] = [
  { key: 'choice', label: '选择' },
  { key: 'blank', label: '填空' },
  { key: 'essay', label: '简答' },
]

export function StepGenerate() {
  const [tab, setTab] = useState<'ppt' | 'quiz'>('ppt')
  const model = useCourseStore((s) => s.model)
  const setModel = useCourseStore((s) => s.setModel)
  const [loading, setLoading] = useState(false)

  const buildContext = useCourseStore((s) => s.buildContext)
  const name = useCourseStore((s) => s.name)
  const slides = useCourseStore((s) => s.slides)
  const setSlides = useCourseStore((s) => s.setSlides)
  const updateSlide = useCourseStore((s) => s.updateSlide)
  const quizzes = useCourseStore((s) => s.quizzes)
  const setQuizzes = useCourseStore((s) => s.setQuizzes)
  const setStep = useCourseStore((s) => s.setStep)
  const exportJson = useCourseStore((s) => s.exportJson)

  // PPT options
  const [audience, setAudience] = useState<Audience>('高中')
  const [pages, setPages] = useState(8)
  const [style, setStyle] = useState<PptStyle>('讲解型')

  // Quiz options
  const [types, setTypes] = useState<QuestionType[]>(['choice', 'blank'])
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState(3)

  const runPpt = async () => {
    setLoading(true)
    try {
      const result = await generatePpt(
        { context: buildContext(), options: { audience, pages, style } },
        model,
      )
      setSlides(result)
      toast.success(`已生成 ${result.length} 页幻灯片`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const runQuiz = async () => {
    if (types.length === 0) {
      toast.error('请至少选择一种题型')
      return
    }
    setLoading(true)
    try {
      const result = await generateQuiz(
        { context: buildContext(), questionTypes: types, count, difficulty },
        model,
      )
      setQuizzes(result)
      toast.success(`已生成 ${result.length} 道题`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleType = (t: QuestionType) =>
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-edu-soft bg-white p-1 shadow-soft">
          {(['ppt', 'quiz'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                tab === t ? 'bg-edu-accent text-white' : 'text-slate-500'
              }`}
            >
              {t === 'ppt' ? 'PPT' : '练习题'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-full border border-edu-soft px-3 py-1.5 text-sm outline-none"
          >
            {MODELS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={exportJson}
            className="rounded-full border border-edu-soft px-3 py-1.5 text-sm text-edu-accentDark hover:bg-edu-blue"
          >
            导出课程JSON
          </button>
        </div>
      </div>

      {tab === 'ppt' ? (
        <section className="rounded-card border border-edu-soft bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="受众">
              <Select
                value={audience}
                onChange={(v) => setAudience(v as Audience)}
                options={['初中', '高中', '大学']}
              />
            </Field>
            <Field label="页数">
              <input
                type="number"
                min={3}
                max={20}
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-20 rounded-full border border-edu-soft px-3 py-1.5 text-sm outline-none"
              />
            </Field>
            <Field label="风格">
              <Select
                value={style}
                onChange={(v) => setStyle(v as PptStyle)}
                options={['讲解型', '复习型']}
              />
            </Field>
            <button
              onClick={runPpt}
              disabled={loading}
              className="ml-auto rounded-full bg-edu-accent px-5 py-2 text-sm font-medium text-white shadow-soft hover:bg-edu-accentDark disabled:opacity-50"
            >
              {loading ? '生成中…' : '生成 PPT'}
            </button>
          </div>

          <div className="mt-5">
            {loading ? (
              <CardSkeleton />
            ) : slides.length > 0 ? (
              <>
                <PptView slides={slides} onEdit={updateSlide} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => exportPptx(name, slides)}
                    className="rounded-full bg-edu-accentDark px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    导出 .pptx（含备注）
                  </button>
                  <button
                    onClick={runPpt}
                    className="rounded-full border border-edu-soft px-4 py-2 text-sm text-edu-accentDark hover:bg-edu-blue"
                  >
                    重新生成
                  </button>
                  <span className="self-center text-xs text-slate-400">
                    提示：直接点击幻灯片文字即可编辑
                  </span>
                </div>
              </>
            ) : (
              <Empty text="设置选项后点击「生成 PPT」" />
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-card border border-edu-soft bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="题型">
              <div className="flex gap-1">
                {ALL_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => toggleType(t.key)}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      types.includes(t.key)
                        ? 'bg-edu-accent text-white'
                        : 'border border-edu-soft text-slate-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="数量">
              <input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-20 rounded-full border border-edu-soft px-3 py-1.5 text-sm outline-none"
              />
            </Field>
            <Field label={`难度 ${difficulty}/5`}>
              <input
                type="range"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="accent-edu-accent"
              />
            </Field>
            <button
              onClick={runQuiz}
              disabled={loading}
              className="ml-auto rounded-full bg-edu-accent px-5 py-2 text-sm font-medium text-white shadow-soft hover:bg-edu-accentDark disabled:opacity-50"
            >
              {loading ? '生成中…' : '生成练习题'}
            </button>
          </div>

          <div className="mt-5">
            {loading ? (
              <CardSkeleton />
            ) : quizzes.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  已生成 {quizzes.length} 道题，进入课堂开始作答。
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
                  {quizzes.map((q) => (
                    <li key={q.id}>
                      <span className="rounded bg-edu-soft px-1.5 py-0.5 text-xs text-edu-accentDark">
                        {q.type}
                      </span>{' '}
                      {q.question}
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => setStep('classroom')}
                  className="rounded-full bg-edu-accentDark px-5 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  进入课堂作答 →
                </button>
              </div>
            ) : (
              <Empty text="设置选项后点击「生成练习题」" />
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-edu-soft px-3 py-1.5 text-sm outline-none"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-card border-2 border-dashed border-edu-soft bg-edu-cream py-16 text-sm text-slate-400">
      {text}
    </div>
  )
}

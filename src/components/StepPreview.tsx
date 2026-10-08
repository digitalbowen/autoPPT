import { useMemo } from 'react'
import { useCourseStore } from '../store/courseStore'
import { toast } from './Toast'

export function StepPreview() {
  const name = useCourseStore((s) => s.name)
  const setName = useCourseStore((s) => s.setName)
  const pages = useCourseStore((s) => s.pages)
  const chunks = useCourseStore((s) => s.chunks)
  const selectedIds = useCourseStore((s) => s.selectedChunkIds)
  const toggleChunk = useCourseStore((s) => s.toggleChunk)
  const selectAll = useCourseStore((s) => s.selectAll)
  const setStep = useCourseStore((s) => s.setStep)
  const saveCourse = useCourseStore((s) => s.saveCourse)
  const loadLast = useCourseStore((s) => s.loadLast)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allOn = chunks.length > 0 && selectedIds.length === chunks.length

  const goGenerate = () => {
    if (selectedIds.length === 0) {
      toast.error('请至少勾选一个片段')
      return
    }
    setStep('generate')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-edu-soft bg-white p-4 shadow-soft">
        <label className="flex items-center gap-2">
          <span className="text-sm text-slate-500">课程名</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-full border border-edu-soft px-3 py-1.5 text-sm outline-none focus:border-edu-accent"
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void saveCourse().then(() => toast.success('已保存课程'))}
            className="rounded-full border border-edu-soft px-3 py-1.5 text-sm text-edu-accentDark hover:bg-edu-blue"
          >
            保存课程
          </button>
          <button
            onClick={() =>
              void loadLast().then((ok) =>
                ok ? toast.success('已恢复上次') : toast.error('没有可恢复的课程'),
              )
            }
            className="rounded-full border border-edu-soft px-3 py-1.5 text-sm text-edu-accentDark hover:bg-edu-blue"
          >
            恢复上次
          </button>
          <button
            onClick={goGenerate}
            className="rounded-full bg-edu-accent px-4 py-1.5 text-sm font-medium text-white shadow-soft hover:bg-edu-accentDark"
          >
            下一步：生成 →
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-edu-soft bg-white p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-edu-ink">原文预览</h3>
          <div className="max-h-[60vh] space-y-4 overflow-auto pr-1">
            {pages.map((p) => (
              <div key={p.pageNo}>
                <div className="mb-1 text-xs font-medium text-edu-accentDark">
                  第 {p.pageNo} 页
                </div>
                <p className="whitespace-pre-wrap rounded-xl bg-edu-cream p-3 text-sm leading-relaxed text-slate-600">
                  {p.text || '（本页无文本）'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-edu-soft bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-edu-ink">
              片段（已选 {selectedIds.length}/{chunks.length}）
            </h3>
            <button
              onClick={() => selectAll(!allOn)}
              className="text-xs text-edu-accentDark hover:underline"
            >
              {allOn ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
            {chunks.map((c) => {
              const on = selectedSet.has(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${
                    on
                      ? 'border-edu-accent bg-edu-blue/50'
                      : 'border-edu-soft bg-white hover:bg-edu-cream'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleChunk(c.id)}
                    className="mt-1 h-4 w-4 accent-edu-accent"
                  />
                  <div>
                    <div className="mb-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span className="rounded bg-edu-soft px-1.5 py-0.5 text-edu-accentDark">
                        {c.id}
                      </span>
                      <span>{c.chapter}</span>
                      {c.pageNo != null && <span>· p{c.pageNo}</span>}
                    </div>
                    <p className="line-clamp-3 text-slate-600">{c.text}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

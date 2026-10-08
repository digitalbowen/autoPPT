import { useRef, useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useFileParser } from '../parser/useFileParser'
import { toast } from './Toast'
import { Skeleton } from './Skeleton'

export function StepUpload() {
  const { parsing, parseFile, parseText } = useFileParser()
  const setParsed = useCourseStore((s) => s.setParsed)
  const setName = useCourseStore((s) => s.setName)
  const setStep = useCourseStore((s) => s.setStep)
  const name = useCourseStore((s) => s.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pasted, setPasted] = useState('')

  const handleFile = async (file?: File) => {
    if (!file) return
    try {
      if (!useCourseStore.getState().name || name === '未命名课程') {
        setName(file.name.replace(/\.[^.]+$/, ''))
      }
      const { pages, chunks } = await parseFile(file)
      setParsed(pages, chunks)
      toast.success(`解析完成，共 ${chunks.length} 个片段`)
      setStep('preview')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '解析失败')
    }
  }

  const handlePaste = () => {
    if (!pasted.trim()) {
      toast.error('请先粘贴文本')
      return
    }
    const { pages, chunks } = parseText(pasted)
    setParsed(pages, chunks)
    toast.success(`解析完成，共 ${chunks.length} 个片段`)
    setStep('preview')
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-card border border-edu-soft bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-edu-ink">上传学习材料</h2>
        <p className="mt-1 text-sm text-slate-500">支持 PDF、Word(.docx)、文本(.txt/.md)</p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void handleFile(e.dataTransfer.files?.[0])
          }}
          onClick={() => inputRef.current?.click()}
          className="mt-4 cursor-pointer rounded-card border-2 border-dashed border-edu-soft bg-edu-blue/40 p-10 text-center transition hover:border-edu-accent"
        >
          <div className="text-4xl">📄</div>
          <div className="mt-2 text-sm font-medium text-edu-accentDark">
            点击或拖拽文件到此处
          </div>
          <div className="mt-1 text-xs text-slate-400">PDF / DOCX / TXT</div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? undefined)}
          />
        </div>

        {parsing && (
          <div className="mt-4">
            <Skeleton lines={3} />
          </div>
        )}
      </section>

      <section className="rounded-card border border-edu-soft bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-edu-ink">或直接粘贴文本</h2>
        <p className="mt-1 text-sm text-slate-500">适合临时片段或从网页复制的内容</p>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="在此粘贴学习材料…"
          className="mt-4 h-56 w-full resize-none rounded-card border border-edu-soft bg-edu-cream p-3 text-sm outline-none focus:border-edu-accent"
        />
        <button
          onClick={handlePaste}
          disabled={parsing}
          className="mt-4 w-full rounded-full bg-edu-accent py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-edu-accentDark disabled:opacity-50"
        >
          解析粘贴内容
        </button>
      </section>
    </div>
  )
}

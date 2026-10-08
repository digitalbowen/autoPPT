import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Chunk, Quiz } from '../types'
import { tutorChat } from '../lib/api'
import { toast } from './Toast'

interface TutorChatProps {
  quiz: Quiz
  sources: Chunk[]
  model?: string
}

/** Socratic tutor conversation for a single quiz; AI guides, never gives the answer. */
export function TutorChat({ quiz, sources, model }: TutorChatProps) {
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const kickedOff = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ask = async (text: string, history: ChatMessage[]) => {
    setBusy(true)
    try {
      const reply = await tutorChat(
        {
          question: quiz.question,
          options: quiz.options,
          referenceAnswer: quiz.answer,
          context: sources.map((s) => s.text).join('\n').slice(0, 1500),
          messages: [...history, { role: 'user', content: text }],
        },
        model,
      )
      setChat([
        ...history,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '对话失败')
    } finally {
      setBusy(false)
    }
  }

  // Open with a leading question instead of the answer.
  useEffect(() => {
    if (kickedOff.current) return
    kickedOff.current = true
    void ask('我不太会做这道题，请引导我一步步思考，先不要告诉我答案。', [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat, busy])

  const send = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    void ask(text, chat)
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-1">
        {chat.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-edu-accent text-white'
                  : 'bg-white text-slate-700 shadow-soft'
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        {busy && <div className="text-left text-xs text-slate-400">AI 思考中…</div>}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={busy}
          placeholder="说说你的思路，或问 AI…"
          className="flex-1 rounded-full border border-edu-soft px-4 py-2 text-sm outline-none focus:border-edu-accent"
        />
        <button
          onClick={send}
          disabled={busy}
          className="rounded-full bg-edu-accent px-5 py-2 text-sm text-white disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  )
}

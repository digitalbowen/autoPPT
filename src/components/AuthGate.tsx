import { useState, type ReactNode } from 'react'

// ⚠️ 档位1「假登录」：密码写死在前端，仅用于挡住随手访问的人。
// 这不是真正的安全——按 F12 能看到此密码，API 接口也未受保护。
// 要改密码就改这一行。要真正防护请改用服务端校验（档位2）。
const PASSWORD = 'autoppt2026'
const AUTH_KEY = 'edugen_auth'

export function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(
    () => localStorage.getItem(AUTH_KEY) === '1',
  )
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (authed) return <>{children}</>

  const submit = () => {
    if (input === PASSWORD) {
      localStorage.setItem(AUTH_KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-card border border-edu-soft bg-white p-8 shadow-card">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-edu-accent text-2xl font-bold text-white">
            E
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-wide text-edu-ink">
            AUTO-PPT
          </h1>
          <p className="mt-1 text-sm text-slate-400">资料驱动教学生成</p>
          <p className="mt-3 text-sm text-slate-500">请输入访问密码</p>
        </div>

        <input
          type="password"
          value={input}
          autoFocus
          onChange={(e) => {
            setInput(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="访问密码"
          className={`w-full rounded-full border px-4 py-2.5 text-sm outline-none transition ${
            error
              ? 'border-rose-300 focus:border-rose-400'
              : 'border-edu-soft focus:border-edu-accent'
          }`}
        />
        {error && (
          <p className="mt-2 text-center text-xs text-rose-500">密码不正确</p>
        )}

        <button
          onClick={submit}
          className="mt-4 w-full rounded-full bg-edu-accent py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-edu-accentDark"
        >
          进入
        </button>
      </div>
    </div>
  )
}

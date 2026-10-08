import type { VercelRequest, VercelResponse } from '@vercel/node'

// Server-only. The DashScope key never leaves this function.
const BASE_URL =
  process.env.DASHSCOPE_BASE_URL ??
  'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = process.env.DASHSCOPE_MODEL ?? 'qwen-plus'
const TIMEOUT_MS = 60_000

type Mode = 'ppt' | 'quiz' | 'grade'

const SYSTEM_PROMPTS: Record<Mode, string> = {
  ppt: '你是资深教研员。你只能基于用户给定的材料生成教学幻灯片，每一页都要在 sourceChunkIds 中标注所依据的材料片段 id，严禁编造材料中不存在的内容。输出必须是严格的 JSON 对象。',
  quiz: '你是出题专家。请按布鲁姆认知分类法（记忆/理解/应用/分析/评价/创造）出题，所有题目的答案必须可溯源到给定材料原文，并在 sourceChunkIds 标注依据片段 id。严禁编造。输出必须是严格的 JSON 对象。',
  grade:
    '你是经验丰富的批改老师。请给出 1-5 星评级与具体改进建议，不要简单判断对错，而要指出亮点与不足。输出必须是严格的 JSON 对象。',
}

function buildUserPrompt(mode: Mode, payload: Record<string, unknown>): string {
  if (mode === 'ppt') {
    const o = (payload.options ?? {}) as Record<string, unknown>
    return [
      `面向【${o.audience ?? '高中'}】学生，风格【${o.style ?? '讲解型'}】，共约 ${o.pages ?? 8} 页幻灯片。`,
      '请仅基于以下带 id 的材料片段生成，返回如下 JSON：',
      '{"slides":[{"title":"","points":["要点1","要点2"],"speakerNotes":"讲稿","sourceChunkIds":["c1"]}]}',
      '材料片段：',
      String(payload.context ?? ''),
    ].join('\n')
  }
  if (mode === 'quiz') {
    return [
      `请出 ${payload.count ?? 5} 道题，题型限定为 ${JSON.stringify(payload.questionTypes ?? ['choice'])}，难度 ${payload.difficulty ?? 3}/5。`,
      '返回如下 JSON：',
      '{"quizzes":[{"id":"q1","type":"choice","question":"","options":["A","B","C","D"],"answer":"A","explain":"解析","sourceChunkIds":["c1"]}]}',
      '填空题 answer 为标准答案文本；简答题 options 省略，answer 为参考答案要点。',
      '材料片段：',
      String(payload.context ?? ''),
    ].join('\n')
  }
  // grade
  return [
    '请批改以下简答题作答，返回 JSON：',
    '{"stars":4,"correct":true,"feedback":"具体改进建议"}',
    `题目：${String(payload.question ?? '')}`,
    `参考答案：${String(payload.referenceAnswer ?? '')}`,
    `学生作答：${String(payload.userAnswer ?? '')}`,
  ].join('\n')
}

/** Strip ```json fences and parse the model's content tolerantly. */
function parseContent(content: string): unknown {
  let text = content.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }
  return JSON.parse(text)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' })
    return
  }

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    res.status(500).json({ ok: false, error: '服务端未配置 DASHSCOPE_API_KEY' })
    return
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    mode?: Mode
    payload?: Record<string, unknown>
    model?: string
  }
  const mode = body?.mode
  if (!mode || !['ppt', 'quiz', 'grade'].includes(mode)) {
    res.status(400).json({ ok: false, error: '无效的 mode' })
    return
  }

  const model = body.model || DEFAULT_MODEL
  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS[mode] },
      { role: 'user', content: buildUserPrompt(mode, body.payload ?? {}) },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  }
  // qwen3 series: thinking mode is incompatible with non-streaming JSON output.
  if (/^qwen3/i.test(model)) {
    requestBody.enable_thinking = false
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    if (!resp.ok) {
      const detail = await resp.text()
      res
        .status(502)
        .json({ ok: false, error: `上游错误 ${resp.status}: ${detail.slice(0, 300)}` })
      return
    }

    const json = (await resp.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) {
      res.status(502).json({ ok: false, error: '上游返回为空' })
      return
    }

    const data = parseContent(content)
    res.status(200).json({ ok: true, data })
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    res.status(aborted ? 504 : 500).json({
      ok: false,
      error: aborted ? '请求超时（60s）' : e instanceof Error ? e.message : '生成失败',
    })
  } finally {
    clearTimeout(timer)
  }
}

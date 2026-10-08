import type {
  ApiResponse,
  GenerateMode,
  GradePayload,
  GradeResult,
  PptPayload,
  Quiz,
  QuizPayload,
  Slide,
} from '../types'

async function post<T>(
  mode: GenerateMode,
  payload: PptPayload | QuizPayload | GradePayload,
  model?: string,
): Promise<T> {
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, payload, model }),
  })
  const json = (await resp.json()) as ApiResponse<T>
  if (!json.ok) throw new Error(json.error)
  return json.data
}

export async function generatePpt(
  payload: PptPayload,
  model?: string,
): Promise<Slide[]> {
  const data = await post<{ slides: Slide[] }>('ppt', payload, model)
  // Normalize: the LLM may omit fields; guarantee the shape UI expects.
  return (data.slides ?? []).map((s) => ({
    title: s?.title ?? '',
    points: Array.isArray(s?.points) ? s.points : [],
    speakerNotes: s?.speakerNotes ?? '',
    sourceChunkIds: Array.isArray(s?.sourceChunkIds) ? s.sourceChunkIds : [],
  }))
}

export async function generateQuiz(
  payload: QuizPayload,
  model?: string,
): Promise<Quiz[]> {
  const data = await post<{ quizzes: Quiz[] }>('quiz', payload, model)
  return (data.quizzes ?? []).map((q, i) => ({
    id: q?.id || `q${i + 1}`,
    type: q?.type ?? 'choice',
    question: q?.question ?? '',
    options: Array.isArray(q?.options) ? q.options : undefined,
    answer: q?.answer ?? '',
    explain: q?.explain ?? '',
    sourceChunkIds: Array.isArray(q?.sourceChunkIds) ? q.sourceChunkIds : [],
  }))
}

export async function gradeEssay(
  payload: GradePayload,
  model?: string,
): Promise<GradeResult> {
  return post<GradeResult>('grade', payload, model)
}

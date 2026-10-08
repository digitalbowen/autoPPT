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
  return data.slides ?? []
}

export async function generateQuiz(
  payload: QuizPayload,
  model?: string,
): Promise<Quiz[]> {
  const data = await post<{ quizzes: Quiz[] }>('quiz', payload, model)
  return (data.quizzes ?? []).map((q, i) => ({
    ...q,
    id: q.id || `q${i + 1}`,
  }))
}

export async function gradeEssay(
  payload: GradePayload,
  model?: string,
): Promise<GradeResult> {
  return post<GradeResult>('grade', payload, model)
}

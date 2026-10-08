// Shared domain types for EduGen.

export type Audience = '初中' | '高中' | '大学'
export type PptStyle = '讲解型' | '复习型'
export type QuestionType = 'choice' | 'blank' | 'essay'
export type StepKey = 'upload' | 'preview' | 'generate' | 'classroom'

/** One raw page of extracted source text. */
export interface SourcePage {
  pageNo: number
  text: string
}

/** A selectable unit of source material fed to the LLM. */
export interface Chunk {
  id: string
  chapter: string
  text: string
  pageNo?: number
}

export interface PptOptions {
  audience: Audience
  pages: number
  style: PptStyle
}

export interface Slide {
  title: string
  points: string[]
  speakerNotes: string
  sourceChunkIds: string[]
}

export interface QuizOptions {
  questionTypes: QuestionType[]
  count: number
  difficulty: number // 1-5
}

export interface Quiz {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  answer: string
  explain: string
  sourceChunkIds: string[]
}

/** A learner's recorded attempt at a quiz item. */
export interface AnswerRecord {
  quizId: string
  userAnswer: string
  correct: boolean
  stars?: number // essay grading, 1-5
  feedback?: string
  timeMs: number
  at: number
}

/** Full persisted course document (one per project). */
export interface Course {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  pages: SourcePage[]
  chunks: Chunk[]
  selectedChunkIds: string[]
  slides: Slide[]
  quizzes: Quiz[]
  answers: AnswerRecord[]
}

// ---- API contracts ----

export type GenerateMode = 'ppt' | 'quiz' | 'grade' | 'tutor'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TutorPayload {
  question: string
  options?: string[]
  referenceAnswer: string
  context?: string
  messages: ChatMessage[]
}

export interface PptPayload {
  context: string
  options: PptOptions
}

export interface QuizPayload {
  context: string
  questionTypes: QuestionType[]
  count: number
  difficulty: number
}

export interface GradePayload {
  question: string
  referenceAnswer: string
  userAnswer: string
}

export interface GenerateRequest {
  mode: GenerateMode
  payload: PptPayload | QuizPayload | GradePayload
  model?: string
}

export interface GradeResult {
  stars: number
  correct: boolean
  feedback: string
}

export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }
